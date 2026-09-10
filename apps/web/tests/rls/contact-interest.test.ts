import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Part C1: "A separate non-account contact-interest form is permitted only
// when the Product Owner explicitly enables it. It must not create supplier
// profiles or trigger onboarding messages."
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(SUPABASE_URL)) {
  throw new Error(`Refusing to run against a non-local Supabase URL (${SUPABASE_URL}).`);
}
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const PASSWORD = "InterestFormTest1234!";
const stamp = Date.now();

async function submit(payload: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/interest-submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify(payload),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
async function setFlag(on: boolean) {
  await admin.from("platform_settings").update({ contact_interest_form_enabled: on }).eq("id", 1);
}

let adminUser: { id: string; client: SupabaseClient };
let plainUser: { id: string; client: SupabaseClient };
const userIds: string[] = [];
const emails: string[] = [];
const roleAssignmentIds: string[] = []; // for the log_activity() audit rows (no FK cascade)

beforeAll(async () => {
  const mk = async (tag: string, role?: string) => {
    const email = `rls-interest-${tag}-${stamp}@stitchd.test`;
    const { data } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
    userIds.push(data!.user!.id);
    if (role) {
      const { data: ra } = await admin.from("role_assignments").insert({ user_id: data!.user!.id, role, status: "active" }).select("id").single();
      if (ra) roleAssignmentIds.push(ra.id);
    }
    const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    await client.auth.signInWithPassword({ email, password: PASSWORD });
    return { id: data!.user!.id, client };
  };
  adminUser = await mk("admin", "admin");
  plainUser = await mk("plain");
});

afterAll(async () => {
  await setFlag(false);
  await admin.from("interest_submissions").delete().in("email", emails);
  await admin.from("rate_limit_hits").delete().eq("bucket", "interest_submit");
  if (roleAssignmentIds.length) await admin.from("activity_log").delete().in("entity_id", roleAssignmentIds);
  for (const id of userIds) {
    await admin.from("role_assignments").delete().eq("user_id", id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("contact-interest form (Part C1)", () => {
  it("is refused while the Product Owner switch is off — even by a direct API call", async () => {
    await setFlag(false);
    const email = `off-${stamp}@example.com`;
    emails.push(email);
    const res = await submit({ kind: "supplier", name: "Off Test", email });
    expect(res.status).toBe(403);
    const { count } = await admin.from("interest_submissions").select("*", { count: "exact", head: true }).eq("email", email);
    expect(count).toBe(0);
  });

  it("records a submission once enabled — and creates no supplier, lead, account or message", async () => {
    await setFlag(true);
    const email = `on-${stamp}@example.com`;
    emails.push(email);

    const before = await Promise.all([
      admin.from("suppliers").select("*", { count: "exact", head: true }),
      admin.from("leads").select("*", { count: "exact", head: true }),
      admin.from("message_log").select("*", { count: "exact", head: true }),
    ]);

    const res = await submit({ kind: "supplier", name: "Naledi Test", email, org_name: "Test Florals", message: "Keen to hear more." });
    expect(res.status).toBe(200);
    expect(res.json).toMatchObject({ ok: true });
    expect(res.json.ref).toMatch(/^ST-INT-/);

    const { data: row } = await admin.from("interest_submissions").select("kind, name, email, org_name, handled").eq("email", email).single();
    expect(row).toMatchObject({ kind: "supplier", name: "Naledi Test", email, org_name: "Test Florals", handled: false });

    const after = await Promise.all([
      admin.from("suppliers").select("*", { count: "exact", head: true }),
      admin.from("leads").select("*", { count: "exact", head: true }),
      admin.from("message_log").select("*", { count: "exact", head: true }),
    ]);
    expect(after[0].count).toBe(before[0].count); // no supplier profile
    expect(after[1].count).toBe(before[1].count); // no lead
    expect(after[2].count).toBe(before[2].count); // no onboarding message

    // no auth user was created for this email either
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    expect(users.users.some((u) => u.email === email)).toBe(false);
  });

  it("validates kind and email", async () => {
    await setFlag(true);
    expect((await submit({ kind: "hacker", name: "X", email: "x@example.com" })).status).toBe(400);
    expect((await submit({ kind: "couple", name: "X", email: "not-an-email" })).status).toBe(400);
    expect((await submit({ kind: "couple", name: "", email: "x@example.com" })).status).toBe(400);
  });

  it("rate-limits at 5 per hour per email (Part K1 shape)", async () => {
    await setFlag(true);
    const email = `rate-${stamp}@example.com`;
    emails.push(email);
    const results: number[] = [];
    for (let i = 0; i < 6; i++) {
      results.push((await submit({ kind: "other", name: `Attempt ${i}`, email })).status);
    }
    expect(results.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(results[5]).toBe(429);
  });

  it("only admin/super can read submissions; a plain signed-in user cannot", async () => {
    await setFlag(true);
    const email = `read-${stamp}@example.com`;
    emails.push(email);
    await submit({ kind: "couple", name: "Read Test", email });

    const { data: adminSees } = await adminUser.client.from("interest_submissions").select("id").eq("email", email);
    expect(adminSees).toHaveLength(1);

    const { data: plainSees } = await plainUser.client.from("interest_submissions").select("id").eq("email", email);
    expect(plainSees ?? []).toEqual([]);

    // a plain user cannot write either
    const { data: adminRow } = await admin.from("interest_submissions").select("id").eq("email", email).single();
    const { error: plainWrite } = await plainUser.client.from("interest_submissions").update({ handled: true }).eq("id", adminRow!.id);
    // RLS returns no error but affects zero rows — confirm it stayed false
    void plainWrite;
    const { data: still } = await admin.from("interest_submissions").select("handled").eq("id", adminRow!.id).single();
    expect(still!.handled).toBe(false);

    // admin can mark it handled
    const { error: adminWrite } = await adminUser.client.from("interest_submissions").update({ handled: true, handled_at: new Date().toISOString() }).eq("id", adminRow!.id);
    expect(adminWrite).toBeNull();
    const { data: done } = await admin.from("interest_submissions").select("handled").eq("id", adminRow!.id).single();
    expect(done!.handled).toBe(true);
  });
});
