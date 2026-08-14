// POST /functions/v1/auth-test-token  { "role": "client"|"supplier"|"coach"|"ops"|"admin"|"super" }
// STITCHD-SRS-SDS.md §13.2 — sandbox-only endpoint that mints a scoped JWT per
// role so testers can exercise every role without OTP. Gated by the
// SANDBOX_TEST_TOKENS secret; must be unset/"off" outside sandbox use.
// Lazily creates one fixed demo user per role (test-<role>@stitchd.sandbox)
// and keeps its role_assignment in sync, so repeated calls are idempotent.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

const VALID_ROLES = ["client", "supplier", "coach", "ops", "admin", "super"] as const;
type Role = (typeof VALID_ROLES)[number];

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  if ((Deno.env.get("SANDBOX_TEST_TOKENS") ?? "off") !== "on") {
    return jsonResponse({ error: "sandbox test tokens are disabled" }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const role = body?.role as Role | undefined;
  if (!role || !VALID_ROLES.includes(role)) {
    return jsonResponse({ error: `role must be one of ${VALID_ROLES.join(", ")}` }, 400);
  }

  const admin = adminClient();
  const email = `test-${role}@stitchd.sandbox`;
  const password = Deno.env.get("SANDBOX_TEST_PASSWORD") ?? "sandbox-only-not-a-real-secret-123!";

  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) return jsonResponse({ error: listErr.message }, 500);

  let userId = list.users.find((u) => u.email === email)?.id;

  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { sandbox_test_user: true },
    });
    if (createErr) return jsonResponse({ error: createErr.message }, 500);
    userId = created.user.id;
  }

  // Not a plain upsert: role_assignments' unique constraint is
  // (user_id, org_id, role), and Postgres treats NULL org_id values as
  // distinct from each other, so an upsert conflict target never matches
  // here and would insert a fresh duplicate row every call instead of
  // updating. Select-then-write instead.
  const { data: existing, error: findErr } = await admin
    .from("role_assignments")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role)
    .is("org_id", null)
    .maybeSingle();
  if (findErr) return jsonResponse({ error: findErr.message }, 500);

  const roleErr = existing
    ? (await admin.from("role_assignments").update({ status: "active" }).eq("id", existing.id)).error
    : (await admin.from("role_assignments").insert({ user_id: userId, role, status: "active" })).error;
  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);

  const anon = callerClient(null);
  const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({ email, password });
  if (signInErr) return jsonResponse({ error: signInErr.message }, 500);

  return jsonResponse({
    role,
    user_id: userId,
    access_token: signIn.session?.access_token,
    refresh_token: signIn.session?.refresh_token,
    expires_in: signIn.session?.expires_in,
  });
});
