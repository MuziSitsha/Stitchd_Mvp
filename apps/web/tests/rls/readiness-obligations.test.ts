import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// WBS-04 (Part G1 — explainable readiness). Proves the actual scoring
// formula and band rules against real obligations rows, not just that the
// function exists — plus RLS isolation on the new table.
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
const PASSWORD = "ReadinessFixtureTest1234!";
const stamp = Date.now();

async function makeUser(tag: string) {
  const email = `rls-ready-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw new Error(`sign-in failed for ${tag}: ${signInErr.message}`);
  return { id: data.user.id as string, client };
}

let owner: { id: string; client: SupabaseClient };
let attacker: { id: string; client: SupabaseClient };
let eventId: string;
let bookingId: string;
let supplierTicketId: string;
let quoteId: string;
let quoteVersionId: string;
let supplierId: string;
const userIds: string[] = [];
const eventIds: string[] = [];

beforeAll(async () => {
  owner = await makeUser("owner");
  attacker = await makeUser("attacker");
  userIds.push(owner.id, attacker.id);

  const { data: event } = await admin.from("events").insert({ owner_id: owner.id, guest_count: 50 }).select("id").single();
  eventId = event!.id;
  eventIds.push(eventId);

  const { data: supplierUser } = await admin.auth.admin.createUser({ email: `rls-ready-supplier-${stamp}@stitchd.test`, password: PASSWORD, email_confirm: true });
  userIds.push(supplierUser!.user!.id);
  const { data: supplier } = await admin.from("suppliers").insert({ profile_id: supplierUser!.user!.id, category: "florist", name: `RLS Readiness Florist ${stamp}`, status: "active" }).select("id").single();
  supplierId = supplier!.id;

  const { data: ticket } = await admin.from("supplier_tickets").insert({ event_id: eventId, supplier_id: supplier!.id, requested_by: owner.id, status: "confirmed" }).select("id").single();
  supplierTicketId = ticket!.id;

  const { data: quote } = await admin.from("quotes").insert({ ticket_id: supplierTicketId, status: "accepted", current_version: 1 }).select("id").single();
  quoteId = quote!.id;
  const { data: version } = await admin.from("quote_versions").insert({ quote_id: quote!.id, version: 1, total_cents: 500000, created_by: supplierUser!.user!.id }).select("id").single();
  quoteVersionId = version!.id;
  const { data: booking } = await admin.from("bookings").insert({ quote_version_id: version!.id, state: "confirmed" }).select("id").single();
  bookingId = booking!.id;
});

afterAll(async () => {
  // Explicit, ordered, error-checked — the exact quote_versions-has-no-
  // cascade-from-quotes gotcha found and documented in the WBS-02/03 test
  // files repeated itself here because this file didn't reuse that lesson.
  // bookings -> quote_versions has no cascade either (only the reverse:
  // deleting a quote_version cascades to its bookings), so deleting only
  // obligations+bookings+events left quote_versions/quotes/supplier_tickets/
  // suppliers all orphaned, and quote_versions.created_by (no cascade from
  // auth.users) silently blocked deleting the supplier fixture user.
  const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
    ["obligations", () => admin.from("obligations").delete().eq("booking_id", bookingId)],
    ["bookings", () => admin.from("bookings").delete().eq("id", bookingId)],
    ["quote_versions", () => admin.from("quote_versions").delete().eq("id", quoteVersionId)],
    ["quotes", () => admin.from("quotes").delete().eq("id", quoteId)],
    ["supplier_tickets", () => admin.from("supplier_tickets").delete().eq("id", supplierTicketId)],
    ["suppliers", () => admin.from("suppliers").delete().eq("id", supplierId)],
  ];
  for (const [label, run] of steps) {
    const { error } = await run();
    if (error) console.error(`cleanup step "${label}" failed:`, error.message);
  }
  for (const id of eventIds) await admin.from("events").delete().eq("id", id);
  for (const id of userIds) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("obligations — auto-seeded, host-only RLS", () => {
  it("a new booking is auto-seeded with exactly the 6 standard obligations, weights summing to 100", async () => {
    const { data } = await admin.from("obligations").select("rule_key, weight").eq("booking_id", bookingId);
    expect(data).toHaveLength(6);
    expect(data!.reduce((s, o) => s + o.weight, 0)).toBe(100);
  });

  it("the owner can see and update their own booking's obligations", async () => {
    const { data: seen } = await owner.client.from("obligations").select("id").eq("booking_id", bookingId);
    expect(seen).toHaveLength(6);
    const { error } = await owner.client.from("obligations").update({ state: "satisfied" }).eq("booking_id", bookingId).eq("rule_key", "confirmed_scope");
    expect(error).toBeNull();
  });

  it("an unrelated user cannot see or touch this booking's obligations", async () => {
    const { data } = await attacker.client.from("obligations").select("id").eq("booking_id", bookingId);
    expect(data).toEqual([]);
    await attacker.client.from("obligations").update({ state: "satisfied" }).eq("booking_id", bookingId);
    const { data: unchanged } = await admin.from("obligations").select("state").eq("booking_id", bookingId).eq("rule_key", "named_contact").single();
    expect(unchanged?.state).toBe("unsatisfied"); // untouched by the attacker's attempt
  });
});

describe("booking_readiness — the actual scoring formula", () => {
  it("zero satisfied obligations scores 0 and bands red", async () => {
    await admin.from("obligations").update({ state: "unsatisfied" }).eq("booking_id", bookingId);
    const { data } = await owner.client.rpc("booking_readiness", { p_booking_id: bookingId });
    expect(data).toMatchObject({ score: 0, band: "red", applicable_weight: 100 });
  });

  it("marking confirmed_scope + deposit_evidence + named_contact satisfied (25+15+15=55) scores 55, still red (<60)", async () => {
    await admin.from("obligations").update({ state: "satisfied" }).eq("booking_id", bookingId).in("rule_key", ["confirmed_scope", "deposit_evidence", "named_contact"]);
    const { data } = await owner.client.rpc("booking_readiness", { p_booking_id: bookingId });
    expect(data).toMatchObject({ score: 55, band: "red" });
  });

  it("adding arrival_plan (15 more, total 70) crosses into amber (60-84)", async () => {
    await admin.from("obligations").update({ state: "satisfied" }).eq("booking_id", bookingId).eq("rule_key", "arrival_plan");
    const { data } = await owner.client.rpc("booking_readiness", { p_booking_id: bookingId });
    expect(data).toMatchObject({ score: 70, band: "amber" });
  });

  it("satisfying everything (100) with no overdue obligation and no blocker bands green", async () => {
    await admin.from("obligations").update({ state: "satisfied" }).eq("booking_id", bookingId);
    const { data } = await owner.client.rpc("booking_readiness", { p_booking_id: bookingId });
    expect(data).toMatchObject({ score: 100, band: "green", has_overdue: false, has_critical_blocker: false });
  });

  it("marking deposit_evidence not applicable removes it from the denominator — 85/85 still scores 100, not 85/100", async () => {
    await admin.from("obligations").update({ applicable: false }).eq("booking_id", bookingId).eq("rule_key", "deposit_evidence");
    const { data } = await owner.client.rpc("booking_readiness", { p_booking_id: bookingId });
    expect(data).toMatchObject({ score: 100, applicable_weight: 85 });
    await admin.from("obligations").update({ applicable: true }).eq("booking_id", bookingId).eq("rule_key", "deposit_evidence"); // restore for later tests
  });

  it("a future-due (not yet overdue) unsatisfied obligation still shows as a real gap in the score, even while the band stays green", async () => {
    await admin.from("obligations").update({ state: "unsatisfied", due_at: new Date(Date.now() + 86400000).toISOString() }).eq("booking_id", bookingId).eq("rule_key", "reconfirmation");
    const { data } = await owner.client.rpc("booking_readiness", { p_booking_id: bookingId });
    // Score honestly reflects the real gap (100 - reconfirmation's 10 = 90),
    // not silently rounded up to 100 just because nothing is overdue yet.
    // Band is still green per Part G1's own rule (>=85, no blocker, no
    // overdue) — a future-due gap doesn't force amber, only an actually
    // overdue one does (the next test).
    expect(data.score).toBe(90);
    expect(data.band).toBe("green");
    expect(data.has_overdue).toBe(false);
  });

  it("that same obligation becoming actually overdue caps the band at amber, even though the score alone (90) would otherwise read green", async () => {
    await admin.from("obligations").update({ due_at: new Date(Date.now() - 3600000).toISOString() }).eq("booking_id", bookingId).eq("rule_key", "reconfirmation");
    const { data } = await owner.client.rpc("booking_readiness", { p_booking_id: bookingId });
    expect(data.score).toBe(90);
    expect(data.has_overdue).toBe(true);
    expect(data.band).toBe("amber"); // the overdue cap, not the score, is what's forcing this
    await admin.from("obligations").update({ state: "satisfied", due_at: null }).eq("booking_id", bookingId).eq("rule_key", "reconfirmation"); // restore to all-green baseline
  });

  it("a declined supplier_ticket forces red regardless of a perfect score", async () => {
    await admin.from("supplier_tickets").update({ status: "declined" }).eq("id", supplierTicketId);
    const { data } = await owner.client.rpc("booking_readiness", { p_booking_id: bookingId });
    expect(data).toMatchObject({ score: 100, band: "red", has_critical_blocker: true });
    await admin.from("supplier_tickets").update({ status: "confirmed" }).eq("id", supplierTicketId); // restore
  });

  it("zero applicable obligations scores null and bands grey, never 100%", async () => {
    await admin.from("obligations").update({ applicable: false }).eq("booking_id", bookingId);
    const { data } = await owner.client.rpc("booking_readiness", { p_booking_id: bookingId });
    expect(data.score).toBeNull();
    expect(data.band).toBe("grey");
    await admin.from("obligations").update({ applicable: true }).eq("booking_id", bookingId); // restore
  });

  it("an unrelated user cannot compute readiness for a booking they don't own (RLS inside the function, invoker-mode)", async () => {
    const { data, error } = await attacker.client.rpc("booking_readiness", { p_booking_id: bookingId });
    // security invoker means the function's own internal SELECT sees
    // nothing for this caller — zero applicable weight, not real data.
    expect(error).toBeNull();
    expect(data.band).toBe("grey");
    expect(data.applicable_weight).toBe(0);
  });
});

describe("event_readiness — event-level rollup", () => {
  it("reflects the one real booking's current band and full coverage", async () => {
    await admin.from("obligations").update({ state: "satisfied", applicable: true }).eq("booking_id", bookingId);
    const { data } = await owner.client.rpc("event_readiness", { p_event_id: eventId });
    expect(data).toMatchObject({ required_count: 1, assessed_count: 1, worst_band: "green" });
  });
});
