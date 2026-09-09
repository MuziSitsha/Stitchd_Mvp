import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// T-AUTH-02 (Part L1): "two events and two suppliers, revoked roles, forged
// IDs and direct database access" — every one of 29 tables in this project
// relies entirely on RLS, and until this file, none of it was proven by
// anything but careful clicking. This suite proves the two highest-value
// targets: `events` (identity/scope isolation) and `budget_payments`
// (money — Part K's actual security bar).
//
// Hard local-only guard: this creates real auth users and reads the
// service-role key. It must never be pointed at a hosted project.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(SUPABASE_URL)) {
  throw new Error(
    `Refusing to run RLS tests against a non-local Supabase URL (${SUPABASE_URL}). ` +
      `This suite creates and deletes real auth users with the service-role key.`,
  );
}
// The fixed local-dev demo key every `supabase start` prints — not a secret,
// just a default so `yarn test:rls` works out of the box. Override via env
// if your local stack was started with different keys.
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "RlsIsolationTest1234!";
const stamp = Date.now();
const EMAIL_A = `rls-test-a-${stamp}@stitchd.test`;
const EMAIL_B = `rls-test-b-${stamp}@stitchd.test`;

let userAId: string;
let userBId: string;
let clientA: SupabaseClient;
let clientB: SupabaseClient;
let anon: SupabaseClient;
let eventAId: string;
const createdBudgetPaymentIds: string[] = [];

async function signInFreshClient(email: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}

beforeAll(async () => {
  const { data: a, error: aErr } = await admin.auth.admin.createUser({ email: EMAIL_A, password: PASSWORD, email_confirm: true });
  if (aErr || !a.user) throw new Error(`could not create test user A: ${aErr?.message}`);
  userAId = a.user.id;

  const { data: b, error: bErr } = await admin.auth.admin.createUser({ email: EMAIL_B, password: PASSWORD, email_confirm: true });
  if (bErr || !b.user) throw new Error(`could not create test user B: ${bErr?.message}`);
  userBId = b.user.id;

  clientA = await signInFreshClient(EMAIL_A);
  clientB = await signInFreshClient(EMAIL_B);
  anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  // Client A creates one real event, exactly as onboarding would.
  const { data: eventA, error: eventErr } = await clientA
    .from("events")
    .insert({ owner_id: userAId, guest_count: 140 })
    .select("id")
    .single();
  if (eventErr || !eventA) throw new Error(`client A could not create its own event: ${eventErr?.message}`);
  eventAId = eventA.id;
});

afterAll(async () => {
  // Clean up in dependency order — never touch anything outside what this
  // suite itself created, so the pristine demo environment stays pristine.
  for (const id of createdBudgetPaymentIds) {
    await admin.from("budget_payments").delete().eq("id", id);
  }
  if (eventAId) await admin.from("events").delete().eq("id", eventAId);
  if (userAId) await admin.auth.admin.deleteUser(userAId);
  if (userBId) await admin.auth.admin.deleteUser(userBId);
});

describe("events RLS isolation", () => {
  it("owner can read their own event", async () => {
    const { data, error } = await clientA.from("events").select("id, owner_id").eq("id", eventAId).maybeSingle();
    expect(error).toBeNull();
    expect(data?.owner_id).toBe(userAId);
  });

  it("a different authenticated user cannot read another owner's event", async () => {
    const { data, error } = await clientB.from("events").select("id").eq("id", eventAId);
    // RLS filters rows rather than raising an error — the failure mode this
    // test guards against is a query silently returning someone else's row,
    // not a thrown exception.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("an unauthenticated (anon) client cannot read any event", async () => {
    const { data, error } = await anon.from("events").select("id").eq("id", eventAId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("cannot forge ownership on insert (owner_id set to someone else's id)", async () => {
    const { data, error } = await clientB.from("events").insert({ owner_id: userAId, guest_count: 1 }).select("id");
    // with_check (owner_id = auth.uid()) must reject this outright.
    expect(data).toBeFalsy();
    expect(error).not.toBeNull();
  });

  it("cannot update another owner's event", async () => {
    const { data } = await clientB.from("events").update({ guest_count: 9999 }).eq("id", eventAId).select("id");
    // using (owner_id = auth.uid()) means the row simply isn't matched —
    // zero rows affected, not an error, and definitely not a success.
    expect(data).toEqual([]);

    const { data: unchanged } = await admin.from("events").select("guest_count").eq("id", eventAId).single();
    expect(unchanged?.guest_count).toBe(140);
  });
});

describe("budget_payments RLS isolation (money — Part K's actual bar)", () => {
  it("a client cannot forge a paid budget_payments row via direct REST insert", async () => {
    // There is no insert policy for `authenticated` on this table at all —
    // every real row comes from an Edge Function using the service role.
    // Confirming that absence holds, not assuming it from reading the SQL.
    const { data, error } = await clientA
      .from("budget_payments")
      .insert({ event_id: eventAId, label: "Forged deposit", amount_cents: 500000, status: "paid" })
      .select("id");
    expect(data).toBeFalsy();
    expect(error).not.toBeNull();
  });

  it("the owning client sees a real payment; a different client does not", async () => {
    const { data: paymentRow, error: insertErr } = await admin
      .from("budget_payments")
      .insert({ event_id: eventAId, label: "Venue deposit — RLS test", amount_cents: 1200000, status: "paid" })
      .select("id")
      .single();
    if (insertErr || !paymentRow) throw new Error(`service-role seed insert failed: ${insertErr?.message}`);
    createdBudgetPaymentIds.push(paymentRow.id);

    const { data: seenByOwner } = await clientA.from("budget_payments").select("id").eq("id", paymentRow.id);
    expect(seenByOwner).toHaveLength(1);

    const { data: seenByOther } = await clientB.from("budget_payments").select("id").eq("id", paymentRow.id);
    expect(seenByOther).toEqual([]);

    const { data: seenByAnon } = await anon.from("budget_payments").select("id").eq("id", paymentRow.id);
    expect(seenByAnon).toEqual([]);
  });
});
