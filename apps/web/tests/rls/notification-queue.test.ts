import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// WBS-05 (Part I1): the queue table, lease, and retry worker that make
// delivery eventually succeed — proven against the real claim/report RPCs
// and the real notifications-process Edge Function, not just inspected.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(SUPABASE_URL)) {
  throw new Error(`Refusing to run RLS tests against a non-local Supabase URL (${SUPABASE_URL}).`);
}
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const PASSWORD = "QueueFixtureTest1234!";
const stamp = Date.now();

async function makeUser(tag: string, roleRow?: { role: string }) {
  const email = `rls-queue-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  if (roleRow) {
    await admin.from("role_assignments").insert({ user_id: data.user.id, role: roleRow.role, status: "active" });
  }
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw new Error(`sign-in failed for ${tag}: ${signInErr.message}`);
  return { id: data.user.id as string, client };
}

let adminUser: { id: string; client: SupabaseClient };
let plainUser: { id: string; client: SupabaseClient };
const userIds: string[] = [];
const queueIds: string[] = [];

beforeAll(async () => {
  adminUser = await makeUser("admin", { role: "admin" });
  plainUser = await makeUser("plain");
  userIds.push(adminUser.id, plainUser.id);
});

afterAll(async () => {
  await admin.from("notification_queue").delete().in("id", queueIds);
  await admin.from("role_assignments").delete().eq("user_id", adminUser.id);
  for (const id of userIds) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

function enqueue(intentKey: string, overrides: Record<string, unknown> = {}) {
  return admin
    .from("notification_queue")
    .insert({ intent_key: intentKey, ref: `TEST-${stamp}`, template: "dispute_update", vars: { status: "open", ref: "TEST" }, to_phone: null, ...overrides })
    .select("id")
    .single();
}

describe("notification_queue — claim/report state machine", () => {
  it("a queued row can be claimed, and a concurrent claim doesn't get the same row", async () => {
    const { data: row } = await enqueue(`intent-claim-${stamp}`);
    queueIds.push(row!.id);

    const { data: claimed1 } = await admin.rpc("notification_queue_claim", { p_limit: 10, p_lease_seconds: 120 });
    const gotIt = claimed1?.some((r: { id: string }) => r.id === row!.id);
    expect(gotIt).toBe(true);

    const { data: stillLeased } = await admin.from("notification_queue").select("state").eq("id", row!.id).single();
    expect(stillLeased?.state).toBe("leased");

    // A second claim right away must not re-claim the still-active lease.
    const { data: claimed2 } = await admin.rpc("notification_queue_claim", { p_limit: 10, p_lease_seconds: 120 });
    const reClaimed = claimed2?.some((r: { id: string }) => r.id === row!.id);
    expect(reClaimed).toBe(false);
  });

  it("reporting 'sent' marks the row sent", async () => {
    const { data: row } = await enqueue(`intent-sent-${stamp}`);
    queueIds.push(row!.id);
    await admin.rpc("notification_queue_claim", { p_limit: 10, p_lease_seconds: 120 });
    await admin.rpc("notification_queue_report", { p_id: row!.id, p_outcome: "sent" });
    const { data } = await admin.from("notification_queue").select("state").eq("id", row!.id).single();
    expect(data?.state).toBe("sent");
  });

  it("reporting 'failed' schedules a real future retry and records the error", async () => {
    const { data: row } = await enqueue(`intent-fail-${stamp}`);
    queueIds.push(row!.id);
    await admin.rpc("notification_queue_claim", { p_limit: 10, p_lease_seconds: 120 });
    const before = Date.now();
    await admin.rpc("notification_queue_report", { p_id: row!.id, p_outcome: "failed", p_error: "simulated provider timeout" });
    const { data } = await admin.from("notification_queue").select("state, attempts, next_attempt_at, last_error").eq("id", row!.id).single();
    expect(data?.state).toBe("failed");
    expect(data?.attempts).toBe(1);
    expect(data?.last_error).toBe("simulated provider timeout");
    expect(new Date(data!.next_attempt_at).getTime()).toBeGreaterThan(before); // real backoff, not immediate retry
  });

  it("failing max_attempts times dead-letters the row as 'unknown'", async () => {
    const { data: row } = await enqueue(`intent-deadletter-${stamp}`, { max_attempts: 2 });
    queueIds.push(row!.id);
    for (let i = 0; i < 2; i++) {
      await admin.rpc("notification_queue_claim", { p_limit: 10, p_lease_seconds: 120 });
      await admin.rpc("notification_queue_report", { p_id: row!.id, p_outcome: "failed", p_error: `attempt ${i}` });
    }
    const { data } = await admin.from("notification_queue").select("state, attempts").eq("id", row!.id).single();
    expect(data?.state).toBe("unknown"); // the dead letter — visible in Admin, needs a human
    expect(data?.attempts).toBe(2);
  });

  it("intent_key uniqueness makes a re-enqueue of the same intent a harmless no-op, not a duplicate send", async () => {
    const key = `intent-dedup-${stamp}`;
    const { data: first } = await enqueue(key);
    queueIds.push(first!.id);
    const { error } = await admin.from("notification_queue").insert({ intent_key: key, ref: "DUPE", template: "dispute_update", vars: {} });
    expect(error).not.toBeNull(); // unique violation — caller is expected to catch/ignore this, exactly like guest_import_batches
    const { count } = await admin.from("notification_queue").select("*", { count: "exact", head: true }).eq("intent_key", key);
    expect(count).toBe(1);
  });

  it("a crashed run's stale lease becomes claimable again", async () => {
    const { data: row } = await enqueue(`intent-stale-lease-${stamp}`);
    queueIds.push(row!.id);
    // Simulate a worker that leased this and then crashed before reporting.
    await admin.from("notification_queue").update({ state: "leased", leased_until: new Date(Date.now() - 60000).toISOString() }).eq("id", row!.id);
    const { data: reclaimed } = await admin.rpc("notification_queue_claim", { p_limit: 50, p_lease_seconds: 120 });
    expect(reclaimed?.some((r: { id: string }) => r.id === row!.id)).toBe(true);
  });
});

describe("notification_queue — RLS (dead-letter visibility)", () => {
  it("admin can see queue rows; a plain authenticated user cannot", async () => {
    const { data: row } = await enqueue(`intent-rls-${stamp}`);
    queueIds.push(row!.id);
    const { data: seenByAdmin } = await adminUser.client.from("notification_queue").select("id").eq("id", row!.id);
    expect(seenByAdmin).toHaveLength(1);
    const { data: seenByPlain } = await plainUser.client.from("notification_queue").select("id").eq("id", row!.id);
    expect(seenByPlain).toEqual([]);
  });

  it("no authenticated user, not even admin, can insert directly — every real row comes from a service-role caller", async () => {
    const { data, error } = await adminUser.client.from("notification_queue").insert({ intent_key: `intent-forged-${stamp}`, ref: "X", template: "dispute_update", vars: {} }).select("id");
    expect(data).toBeFalsy();
    expect(error).not.toBeNull();
  });
});

describe("notifications-process — the real Edge Function, end to end", () => {
  it("processes a queued row via the real notify() path and marks it suppressed (no phone on file, honestly recorded, not retried forever)", async () => {
    const { data: row } = await enqueue(`intent-e2e-${stamp}`, { template: "dispute_update", vars: { status: "open", ref: `E2E-${stamp}` }, ref: `E2E-${stamp}` });
    queueIds.push(row!.id);

    const res = await fetch(`${SUPABASE_URL}/functions/v1/notifications-process`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${(await adminUser.client.auth.getSession()).data.session?.access_token}` },
      body: JSON.stringify({ limit: 50 }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results.some((r: { id: string; outcome: string }) => r.id === row!.id && r.outcome === "suppressed")).toBe(true);

    const { data: final } = await admin.from("notification_queue").select("state").eq("id", row!.id).single();
    expect(final?.state).toBe("suppressed");

    // notify() itself still wrote the message_log row it always writes —
    // the queue and the existing audit trail agree with each other.
    const { data: logged } = await admin.from("message_log").select("status").eq("ref", `E2E-${stamp}`).maybeSingle();
    expect(logged?.status).toBe("logged");
  });

  it("a non-admin cannot invoke the processor at all", async () => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/notifications-process`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${(await plainUser.client.auth.getSession()).data.session?.access_token}` },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(403);
  });
});
