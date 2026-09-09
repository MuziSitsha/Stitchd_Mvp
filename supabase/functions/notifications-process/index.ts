// POST /functions/v1/notifications-process  { limit?: number }
// Admin/super only (or service-role, for an eventual scheduled trigger).
// Leases due rows from notification_queue, actually sends each one via the
// existing notify() helper, and reports the real outcome back — this is
// the "queue table, lease and retry worker" Part I1 names as the missing
// piece, closing the gap between "we logged the intent" and "delivery
// eventually succeeds."
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { notify } from "../_shared/notify.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "missing Authorization header" }, 401);
  const caller = callerClient(authHeader);
  const { data: userRes, error: userErr } = await caller.auth.getUser();
  if (userErr || !userRes.user) return jsonResponse({ error: "invalid session" }, 401);

  const admin = adminClient();
  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", { p_user_id: userRes.user.id, p_roles: ["admin", "super"] });
  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);
  if (!isAdmin) return jsonResponse({ error: "admin or super role required" }, 403);

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body?.limit) || 20, 1), 100);

  const { data: claimed, error: claimErr } = await admin.rpc("notification_queue_claim", { p_limit: limit, p_lease_seconds: 120 });
  if (claimErr) return jsonResponse({ error: claimErr.message }, 500);

  const results: Array<{ id: string; outcome: string }> = [];
  for (const row of claimed ?? []) {
    try {
      const { status } = await notify(
        row.ref,
        row.template as never,
        row.vars as Record<string, string>,
        row.to_phone,
        row.to_user_id ?? undefined,
      );
      const outcome = status === "sent" ? "sent" : "suppressed";
      await admin.rpc("notification_queue_report", { p_id: row.id, p_outcome: outcome });
      results.push({ id: row.id, outcome });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await admin.rpc("notification_queue_report", { p_id: row.id, p_outcome: "failed", p_error: message });
      results.push({ id: row.id, outcome: "failed" });
    }
  }

  return jsonResponse({ processed: results.length, results });
});
