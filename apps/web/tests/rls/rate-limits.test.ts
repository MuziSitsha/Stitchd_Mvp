import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Part K1's own anti-abuse table, with its exact numbers, proven against
// the real check_rate_limit RPC and two of the three functions it's wired
// into (leads-create, rsvp-import-guests) — login limiting is Supabase
// Auth's own built-in IP-based limiter (config.toml's auth.rate_limit),
// stated as a real gap against the spec's literal per-account wording, not
// silently claimed as covered.
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
const stamp = Date.now();
const testBucket = `test-bucket-${stamp}`;
const suppliersToClean: string[] = [];
const eventsToClean: string[] = [];
const usersToClean: string[] = [];

// afterAll, never sequentially-after-an-assertion within a single it() —
// found the hard way in this same file: a failed expect() throws and
// skips every line after it in that test body, including any inline
// cleanup, leaving real residue behind (traced and cleaned up by hand once
// already before this fix).
afterAll(async () => {
  await admin.from("rate_limit_hits").delete().like("bucket", `${testBucket}%`);
  await admin.from("rate_limit_hits").delete().eq("bucket", "lead_creation").ilike("key", `+27-rate-test-${stamp}%`);
  for (const id of eventsToClean) await admin.from("rate_limit_hits").delete().eq("bucket", "guest_import").eq("key", id);
  for (const id of suppliersToClean) await admin.from("suppliers").delete().eq("id", id);
  for (const id of eventsToClean) {
    await admin.from("functions").delete().eq("event_id", id);
    await admin.from("events").delete().eq("id", id);
  }
  for (const id of usersToClean) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of usersToClean) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

async function call(fn: string, payload: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify(payload),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

describe("check_rate_limit — the primitive", () => {
  it("allows up to max_count hits, then blocks the next one within the window", async () => {
    const key = "key-a";
    for (let i = 0; i < 3; i++) {
      const { data } = await admin.rpc("check_rate_limit", { p_bucket: testBucket, p_key: key, p_max_count: 3, p_window_seconds: 60 });
      expect(data).toBe(true);
    }
    const { data: fourth } = await admin.rpc("check_rate_limit", { p_bucket: testBucket, p_key: key, p_max_count: 3, p_window_seconds: 60 });
    expect(fourth).toBe(false);
  });

  it("a different key in the same bucket has its own independent budget", async () => {
    const { data } = await admin.rpc("check_rate_limit", { p_bucket: testBucket, p_key: "key-b", p_max_count: 3, p_window_seconds: 60 });
    expect(data).toBe(true); // key-a being exhausted above doesn't affect key-b at all
  });

  it("hits outside the window don't count against the limit", async () => {
    const key = "key-c";
    // Backdate 3 "hits" to well before the window — direct insert,
    // simulating time having passed rather than actually waiting.
    await admin.from("rate_limit_hits").insert([
      { bucket: testBucket, key, created_at: new Date(Date.now() - 120000).toISOString() },
      { bucket: testBucket, key, created_at: new Date(Date.now() - 120000).toISOString() },
      { bucket: testBucket, key, created_at: new Date(Date.now() - 120000).toISOString() },
    ]);
    const { data } = await admin.rpc("check_rate_limit", { p_bucket: testBucket, p_key: key, p_max_count: 3, p_window_seconds: 60 });
    expect(data).toBe(true); // those 3 hits are outside the 60s window, so this one is allowed
  });
});

describe("leads-create — real enforcement at 20/hour per requester phone", () => {
  it("the 21st request from the same number in the window is rejected with 429", async () => {
    const { data: supplier } = await admin.from("suppliers").insert({ category: "dj", name: `RLS Rate Limit DJ ${stamp}`, status: "active" }).select("id").single();
    suppliersToClean.push(supplier!.id);
    const phone = `+27-rate-test-${stamp}`;

    // Pre-seed 20 hits directly rather than making 20 real HTTP round
    // trips — this test is about the 21st request being blocked, not
    // re-proving the primitive counts correctly (already covered above).
    const rows = Array.from({ length: 20 }, () => ({ bucket: "lead_creation", key: phone }));
    await admin.from("rate_limit_hits").insert(rows);

    const { status, json } = await call("leads-create", { supplier_id: supplier!.id, requester_name: "Rate Test", requester_phone: phone });
    expect(status).toBe(429);
    expect(json.error).toMatch(/too many requests/);
  });
});

describe("rsvp-import-guests — real enforcement at 5/hour per event", () => {
  it("the 6th distinct import attempt for the same event in the window is rejected with 429", async () => {
    const { data: hostUser } = await admin.auth.admin.createUser({ email: `rls-ratehost-${stamp}@stitchd.test`, password: "RateLimitTest1234!", email_confirm: true });
    usersToClean.push(hostUser!.user!.id);
    const { data: event } = await admin.from("events").insert({ owner_id: hostUser!.user!.id, guest_count: 5 }).select("id").single();
    eventsToClean.push(event!.id);
    // A real function_id — an empty households/guests payload fails the
    // function's own input validation before it ever reaches the rate
    // limit check, which is correct behaviour but not what this test is
    // for, so the fixture needs to actually pass validation.
    const { data: fn } = await admin.from("functions").insert({ event_id: event!.id, name: "Reception" }).select("id").single();

    const rows = Array.from({ length: 5 }, () => ({ bucket: "guest_import", key: event!.id }));
    await admin.from("rate_limit_hits").insert(rows);

    const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    await client.auth.signInWithPassword({ email: `rls-ratehost-${stamp}@stitchd.test`, password: "RateLimitTest1234!" });
    const jwt = (await client.auth.getSession()).data.session?.access_token;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/rsvp-import-guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ event_id: event!.id, fingerprint: `fp-ratelimit-${stamp}`, households: [{ label: "Should Be Blocked", guests: [{ display_name: "X", function_ids: [fn!.id] }] }] }),
    });
    expect(res.status).toBe(429);
    // Cleanup for event/user/rate_limit_hits all lives in afterAll now —
    // see its own comment for why nothing here runs sequentially after
    // this assertion.
  });
});
