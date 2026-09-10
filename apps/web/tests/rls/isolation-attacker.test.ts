import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Part L3's critical end-to-end fixture, applied to RLS rather than the full
// journey: one real scenario (Event A, Supplier A, a real ticket/quote) and
// one deliberate isolation attacker (Event B / "Supplier C") on every table
// the attacker could plausibly reach — suppliers, quotes/quote_versions/
// quote_items, and general support tickets. Local-only, same hard guard and
// cleanup discipline as events-budget-isolation.test.ts.
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
const PASSWORD = "IsolationFixtureTest1234!";
const stamp = Date.now();

async function makeUser(tag: string) {
  const email = `rls-iso-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw new Error(`sign-in failed for ${tag}: ${signInErr.message}`);
  return { id: data.user.id as string, client };
}

// Real scenario
let clientA: { id: string; client: SupabaseClient };
let supplierAUser: { id: string; client: SupabaseClient };
let eventAId: string;
let supplierAId: string;
let supplierTicketAId: string;
let quoteAId: string;
let quoteVersionAId: string;

// Isolation attackers ("Event B" / "Supplier C")
let clientAttacker: { id: string; client: SupabaseClient };
let supplierAttackerUser: { id: string; client: SupabaseClient };
let eventAttackerId: string;
let supplierAttackerId: string;

const userIds: string[] = [];
const eventIds: string[] = [];
const supplierIds: string[] = [];

beforeAll(async () => {
  clientA = await makeUser("client-a");
  supplierAUser = await makeUser("supplier-a");
  clientAttacker = await makeUser("client-attacker");
  supplierAttackerUser = await makeUser("supplier-attacker");
  userIds.push(clientA.id, supplierAUser.id, clientAttacker.id, supplierAttackerUser.id);

  const { data: eventA, error: eaErr } = await admin.from("events").insert({ owner_id: clientA.id, guest_count: 140 }).select("id").single();
  const { data: eventAttacker, error: eatErr } = await admin.from("events").insert({ owner_id: clientAttacker.id, guest_count: 40 }).select("id").single();
  if (!eventA || !eventAttacker) throw new Error(`fixture event creation failed: ${eaErr?.message ?? ""} | ${eatErr?.message ?? ""}`);
  eventAId = eventA.id;
  eventAttackerId = eventAttacker.id;
  eventIds.push(eventAId, eventAttackerId);

  const { data: supplierA } = await admin
    .from("suppliers")
    .insert({ profile_id: supplierAUser.id, category: "catering", name: `RLS Test Caterer A ${stamp}`, status: "active" })
    .select("id")
    .single();
  const { data: supplierAttacker } = await admin
    .from("suppliers")
    .insert({ profile_id: supplierAttackerUser.id, category: "catering", name: `RLS Test Caterer Attacker ${stamp}`, status: "active" })
    .select("id")
    .single();
  if (!supplierA || !supplierAttacker) throw new Error("fixture supplier creation failed");
  supplierAId = supplierA.id;
  supplierAttackerId = supplierAttacker.id;
  supplierIds.push(supplierAId, supplierAttackerId);

  const { data: ticketA } = await admin
    .from("supplier_tickets")
    .insert({ event_id: eventAId, supplier_id: supplierAId, requested_by: clientA.id, status: "confirmed" })
    .select("id")
    .single();
  if (!ticketA) throw new Error("fixture supplier_ticket creation failed");
  supplierTicketAId = ticketA.id;

  const { data: quoteA } = await admin
    .from("quotes")
    .insert({ ticket_id: supplierTicketAId, status: "sent", current_version: 1 })
    .select("id")
    .single();
  if (!quoteA) throw new Error("fixture quote creation failed");
  quoteAId = quoteA.id;

  const { data: versionA } = await admin
    .from("quote_versions")
    .insert({ quote_id: quoteAId, version: 1, total_cents: 1500000, created_by: supplierAUser.id })
    .select("id")
    .single();
  if (!versionA) throw new Error("fixture quote_version creation failed");
  quoteVersionAId = versionA.id;

  await admin.from("quote_items").insert({ quote_version_id: quoteVersionAId, label: "Catering — 140 guests", qty: 140, unit_price_cents: 10714, line_total_cents: 1500000 });

  await admin.from("tickets").insert({
    event_id: eventAId,
    category: "task",
    visibility: "client",
    created_by: clientA.id,
    created_by_role: "client",
  });
});

afterAll(async () => {
  await admin.from("tickets").delete().in("event_id", eventIds);
  await admin.from("quote_items").delete().eq("quote_version_id", quoteVersionAId);
  await admin.from("quote_versions").delete().eq("quote_id", quoteAId);
  await admin.from("quotes").delete().eq("id", quoteAId);
  await admin.from("supplier_tickets").delete().eq("id", supplierTicketAId);
  for (const id of supplierIds) await admin.from("suppliers").delete().eq("id", id);
  for (const id of eventIds) await admin.from("events").delete().eq("id", id);
  for (const id of userIds) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("suppliers — the WBS-01 privileged-column guard", () => {
  it("an attacking supplier cannot self-approve out of pending", async () => {
    // suppliers_profile_id_unique means one profile can only ever claim one
    // row — supplierAttackerUser already owns supplierAttackerId above, so
    // this needs its own throwaway user+row rather than a second supplier
    // for the same profile (which would just fail the unique index, not
    // exercise the guard this test actually cares about).
    const pending = await makeUser("supplier-pending");
    const { data: pendingSupplier } = await admin
      .from("suppliers")
      .insert({ profile_id: pending.id, category: "dj", name: `RLS Test Pending ${stamp}`, status: "pending" })
      .select("id")
      .single();
    if (!pendingSupplier) throw new Error("could not seed a pending supplier for the self-approval check");

    await pending.client.from("suppliers").update({ status: "active" }).eq("id", pendingSupplier.id);
    const { data: stillPending } = await admin.from("suppliers").select("status").eq("id", pendingSupplier.id).single();
    expect(stillPending?.status).toBe("pending");

    await admin.from("suppliers").delete().eq("id", pendingSupplier.id);
    const { error: delErr } = await admin.auth.admin.deleteUser(pending.id);
    if (delErr) console.error(`could not delete fixture user ${pending.id}:`, delErr.message);
  });

  it("an attacking supplier cannot set verified=true on itself", async () => {
    await supplierAttackerUser.client.from("suppliers").update({ verified: true }).eq("id", supplierAttackerId);
    const { data } = await admin.from("suppliers").select("verified").eq("id", supplierAttackerId).single();
    expect(data?.verified).toBe(false);
  });

  it("positive case: a supplier CAN still pause and reactivate their own active listing", async () => {
    // Proves the trigger added this session guards the right thing without
    // over-blocking the one legitimate self-service transition it must allow.
    const { error: pauseErr } = await supplierAttackerUser.client.from("suppliers").update({ status: "paused" }).eq("id", supplierAttackerId);
    expect(pauseErr).toBeNull();
    const { data: paused } = await admin.from("suppliers").select("status").eq("id", supplierAttackerId).single();
    expect(paused?.status).toBe("paused");

    const { error: reactivateErr } = await supplierAttackerUser.client.from("suppliers").update({ status: "active" }).eq("id", supplierAttackerId);
    expect(reactivateErr).toBeNull();
    const { data: reactivated } = await admin.from("suppliers").select("status").eq("id", supplierAttackerId).single();
    expect(reactivated?.status).toBe("active");
  });

  it("an attacking supplier cannot touch a different supplier's row at all", async () => {
    await supplierAttackerUser.client.from("suppliers").update({ status: "paused" }).eq("id", supplierAId);
    const { data } = await admin.from("suppliers").select("status").eq("id", supplierAId).single();
    expect(data?.status).toBe("active"); // untouched — row-level isolation, not just the column guard
  });
});

describe("quotes / quote_versions / quote_items — look-through-the-parent visibility", () => {
  it("the real client and real supplier can both see the real quote", async () => {
    const { data: seenByClient } = await clientA.client.from("quotes").select("id").eq("id", quoteAId);
    expect(seenByClient).toHaveLength(1);
    const { data: seenBySupplier } = await supplierAUser.client.from("quotes").select("id").eq("id", quoteAId);
    expect(seenBySupplier).toHaveLength(1);
  });

  it("neither isolation attacker can see the real quote", async () => {
    const { data: seenByAttackerClient } = await clientAttacker.client.from("quotes").select("id").eq("id", quoteAId);
    expect(seenByAttackerClient).toEqual([]);
    const { data: seenByAttackerSupplier } = await supplierAttackerUser.client.from("quotes").select("id").eq("id", quoteAId);
    expect(seenByAttackerSupplier).toEqual([]);
  });

  it("quote_versions and quote_items correctly look through to the parent quote's own visibility", async () => {
    const { data: versionsByOwner } = await clientA.client.from("quote_versions").select("id").eq("quote_id", quoteAId);
    expect(versionsByOwner).toHaveLength(1);
    const { data: versionsByAttacker } = await clientAttacker.client.from("quote_versions").select("id").eq("quote_id", quoteAId);
    expect(versionsByAttacker).toEqual([]);

    const { data: itemsByOwner } = await clientA.client.from("quote_items").select("id").eq("quote_version_id", quoteVersionAId);
    expect(itemsByOwner).toHaveLength(1);
    const { data: itemsByAttacker } = await clientAttacker.client.from("quote_items").select("id").eq("quote_version_id", quoteVersionAId);
    expect(itemsByAttacker).toEqual([]);
  });

  it("no authenticated client can insert a quote directly via REST — quotes-create's edge function is the only path", async () => {
    const { data, error } = await supplierAUser.client
      .from("quotes")
      .insert({ ticket_id: supplierTicketAId, status: "sent", current_version: 1 })
      .select("id");
    expect(data).toBeFalsy();
    expect(error).not.toBeNull();
  });
});

describe("tickets (general support) — visibility + forged-scope insert rejection", () => {
  it("the real client sees their own ticket; the isolation attacker does not", async () => {
    const { data: seenByOwner } = await clientA.client.from("tickets").select("id").eq("event_id", eventAId);
    expect(seenByOwner!.length).toBeGreaterThan(0);
    const { data: seenByAttacker } = await clientAttacker.client.from("tickets").select("id").eq("event_id", eventAId);
    expect(seenByAttacker).toEqual([]);
  });

  it("a client cannot create a ticket against an event they don't own (forged event_id)", async () => {
    const { data, error } = await clientAttacker.client
      .from("tickets")
      .insert({ event_id: eventAId, category: "task", visibility: "client", created_by: clientAttacker.id, created_by_role: "client" })
      .select("id");
    expect(data).toBeFalsy();
    expect(error).not.toBeNull();
  });

  it("a supplier cannot create a ticket impersonating a different supplier (forged supplier_id)", async () => {
    const { data, error } = await supplierAttackerUser.client
      .from("tickets")
      .insert({ supplier_id: supplierAId, category: "supplier_delay", visibility: "supplier", created_by: supplierAttackerUser.id, created_by_role: "supplier" })
      .select("id");
    expect(data).toBeFalsy();
    expect(error).not.toBeNull();
  });
});
