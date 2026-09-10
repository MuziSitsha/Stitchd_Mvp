import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// T-JOURNEY-01 — Part L3's critical end-to-end fixture, "the spine of Gate
// G1". Event A: 2 functions, 3 households, 5 named guests, 1 permitted
// plus-one. Supplier A caters per head; Supplier B is package photography.
// Event B and Supplier C are the isolation attackers — checked at every
// stage the run could leak. The run itself:
//   request -> quote -> booking -> mixed RSVP -> headcount change approval
//   -> fee payment -> reconfirmation -> no-show ticket -> authorised Rescue
//   -> completion -> reconciliation
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
const PASSWORD = "Journey01Test1234!";
const stamp = Date.now();

// entity ids of rows whose log_activity() audit trail my fixtures create and
// then cascade-delete (activity_log has no FK cascade) — swept in afterAll.
const auditEntityIds: string[] = [];

async function makeUser(tag: string, role?: string) {
  const email = `rls-j1-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  if (role) {
    const { data: ra } = await admin.from("role_assignments").insert({ user_id: data.user.id, role, status: "active" }).select("id").single();
    if (ra) auditEntityIds.push(ra.id);
  }
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: e } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (e) throw new Error(`sign-in failed for ${tag}: ${e.message}`);
  return { id: data.user.id as string, client };
}
async function jwt(u: { client: SupabaseClient }) {
  return (await u.client.auth.getSession()).data.session!.access_token;
}
async function call(fn: string, token: string | null, payload: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    results?: { conflict?: boolean; change_requested?: boolean }[];
    counts?: Record<string, number>;
  };
  return { status: res.status, json };
}

// Actors
let clientA: { id: string; client: SupabaseClient };
let clientB: { id: string; client: SupabaseClient }; // isolation attacker (owns Event B)
let supplierAUser: { id: string; client: SupabaseClient };
let supplierBUser: { id: string; client: SupabaseClient };
let supplierCUser: { id: string; client: SupabaseClient }; // isolation attacker
let ops1: { id: string; client: SupabaseClient };
let ops2: { id: string; client: SupabaseClient };

// Event A graph
let eventA: string, fnCeremony: string, fnReception: string;
let supplierAName: string, supplierBName: string;
let ticketARef: string, ticketBRef: string, ticketAId: string, ticketBId: string;
let quoteARef: string, quoteBRef: string;
let bookingAId: string;
let adebayoHhId: string;
let noShowTicketId: string;

const userIds: string[] = [];
const eventIds: string[] = [];
const supplierIds: string[] = [];

beforeAll(async () => {
  // cron jobs are already paused for the whole run by tests/global-setup.ts.
  clientA = await makeUser("clienta");
  clientB = await makeUser("clientb");
  supplierAUser = await makeUser("supa");
  supplierBUser = await makeUser("supb");
  supplierCUser = await makeUser("supc");
  ops1 = await makeUser("ops1", "admin");
  ops2 = await makeUser("ops2", "admin");
  userIds.push(clientA.id, clientB.id, supplierAUser.id, supplierBUser.id, supplierCUser.id, ops1.id, ops2.id);

  const { data: ea, error: eaErr } = await admin.from("events").insert({ owner_id: clientA.id, guest_count: 6 }).select("id").single();
  if (eaErr) throw new Error(`Event A creation failed: ${eaErr.message}`);
  const { data: eb, error: ebErr } = await admin.from("events").insert({ owner_id: clientB.id, guest_count: 3 }).select("id").single();
  if (ebErr) throw new Error(`Event B creation failed: ${ebErr.message}`);
  eventA = ea!.id;
  eventIds.push(ea!.id, eb!.id);

  const { data: f1 } = await admin.from("functions").insert({ event_id: eventA, name: "Ceremony" }).select("id").single();
  const { data: f2 } = await admin.from("functions").insert({ event_id: eventA, name: "Reception" }).select("id").single();
  fnCeremony = f1!.id;
  fnReception = f2!.id;

  const mkSupplier = async (u: string, cat: string, name: string, unit: string, priceFrom: number) => {
    const { data, error } = await admin
      .from("suppliers")
      .insert({ profile_id: u, category: cat, name, status: "active", pricing_unit: unit, price_from_cents: priceFrom })
      .select("id")
      .single();
    if (error) throw new Error(`supplier ${name} creation failed: ${error.message}`);
    supplierIds.push(data!.id);
    return data!.id;
  };
  supplierAName = `J1 Caterer ${stamp}`;
  supplierBName = `J1 Photographer ${stamp}`;
  await mkSupplier(supplierAUser.id, "catering", supplierAName, "per_head", 45000);
  await mkSupplier(supplierBUser.id, "photography", supplierBName, "total", 1500000);
  await mkSupplier(supplierCUser.id, "catering", `J1 Attacker Caterer ${stamp}`, "per_head", 40000);
});

afterAll(async () => {
  // activity_log is an append-only audit trail with no FK cascade — the
  // log_activity() trigger (service-role writes, so actor_id is null) and
  // quotes-create's explicit row both key off the entity ref, so clean by
  // ref, not just by actor_id.
  const refs = [ticketARef, ticketBRef, quoteARef, quoteBRef].filter(Boolean);
  if (refs.length) await admin.from("activity_log").delete().in("ref", refs);
  if (auditEntityIds.length) await admin.from("activity_log").delete().in("entity_id", auditEntityIds);

  for (const id of eventIds) {
    const { data: hh } = await admin.from("households").select("id").eq("event_id", id);
    for (const h of hh ?? []) {
      await admin.from("rate_limit_hits").delete().eq("bucket", "rsvp_write").eq("key", h.id);
    }
    await admin.from("rate_limit_hits").delete().eq("bucket", "guest_import").eq("key", id);

    // tickets don't cascade from events (on delete set null) — take them out
    // explicitly first, with the notification_queue rows they enqueued (the
    // queue has no FK cascade) and their audit-log rows. rescue_requests
    // cascade from tickets.
    const { data: tix } = await admin.from("tickets").select("id, ref").eq("event_id", id);
    for (const t of tix ?? []) {
      await admin.from("notification_queue").delete().like("intent_key", `${t.id}:%`);
      await admin.from("activity_log").delete().eq("ref", t.ref);
    }
    await admin.from("tickets").delete().eq("event_id", id);

    // deleting the event cascades supplier_tickets -> quotes -> quote_versions
    // -> {quote_items, bookings -> obligations}, plus households -> guests ->
    // {entitlements, responses}, invitations, guest_sessions, functions,
    // guest_import_batches, budget_payments.
    await admin.from("events").delete().eq("id", id);
  }

  for (const id of supplierIds) await admin.from("suppliers").delete().eq("id", id);

  for (const id of userIds) {
    await admin.from("notification_queue").delete().eq("to_user_id", id);
    await admin.from("message_log").delete().eq("to_user_id", id);
    await admin.from("activity_log").delete().eq("actor_id", id);
    await admin.from("role_assignments").delete().eq("user_id", id);
  }
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("T-JOURNEY-01", () => {
  it("1. request: client A asks suppliers A and B; supplier C and client B see neither request", async () => {
    const t1 = await call("supplier-tickets-create", await jwt(clientA), { supplier_name: supplierAName });
    const t2 = await call("supplier-tickets-create", await jwt(clientA), { supplier_name: supplierBName });
    expect(t1.status, JSON.stringify(t1.json)).toBe(200);
    expect(t2.status, JSON.stringify(t2.json)).toBe(200);
    ticketARef = t1.json.ref as string;
    ticketBRef = t2.json.ref as string;

    const { data: rows } = await admin.from("supplier_tickets").select("id, ref").in("ref", [ticketARef, ticketBRef]);
    ticketAId = rows!.find((r) => r.ref === ticketARef)!.id;
    ticketBId = rows!.find((r) => r.ref === ticketBRef)!.id;

    const { data: cSees } = await supplierCUser.client.from("supplier_tickets").select("id").in("id", [ticketAId, ticketBId]);
    expect(cSees).toEqual([]);
    const { data: bSees } = await clientB.client.from("supplier_tickets").select("id").in("id", [ticketAId, ticketBId]);
    expect(bSees).toEqual([]);
    const { data: aSees } = await supplierAUser.client.from("supplier_tickets").select("id").eq("id", ticketAId);
    expect(aSees).toHaveLength(1);
  });

  it("2. quote + booking: each supplier quotes, client A accepts both; a booking with 6 seeded obligations appears", async () => {
    const qa = await call("quotes-create", await jwt(supplierAUser), {
      ticket_ref: ticketARef,
      items: [{ label: "Catering — per head", qty: 6, unit_price_cents: 45000 }],
    });
    const qb = await call("quotes-create", await jwt(supplierBUser), {
      ticket_ref: ticketBRef,
      items: [{ label: "Photography package", qty: 1, unit_price_cents: 1500000 }],
    });
    expect(qa.status, JSON.stringify(qa.json)).toBe(200);
    expect(qb.status, JSON.stringify(qb.json)).toBe(200);
    quoteARef = qa.json.ref as string;
    quoteBRef = qb.json.ref as string;

    // supplier C cannot quote a ticket that isn't theirs
    const forged = await call("quotes-create", await jwt(supplierCUser), {
      ticket_ref: ticketARef,
      items: [{ label: "Undercut", qty: 6, unit_price_cents: 1 }],
    });
    expect(forged.status).toBe(403);

    const ra = await call("quotes-respond", await jwt(clientA), { quote_ref: quoteARef, decision: "accept" });
    const rb = await call("quotes-respond", await jwt(clientA), { quote_ref: quoteBRef, decision: "accept" });
    expect(ra.status, JSON.stringify(ra.json)).toBe(200);
    expect(rb.status, JSON.stringify(rb.json)).toBe(200);

    const { data: qRow } = await admin.from("quotes").select("id").eq("ref", quoteARef).single();
    const { data: qvs } = await admin.from("quote_versions").select("id").eq("quote_id", qRow!.id);
    const { data: bk } = await admin.from("bookings").select("id, state").in("quote_version_id", (qvs ?? []).map((v) => v.id));
    expect(bk, "quotes-respond should have created exactly one booking on accept").toHaveLength(1);
    bookingAId = bk![0].id;

    const { count: obCount } = await admin.from("obligations").select("*", { count: "exact", head: true }).eq("booking_id", bookingAId);
    expect(obCount).toBe(6);

    // client B (attacker) cannot see event A's booking
    const { data: bBk } = await clientB.client.from("bookings").select("id").eq("id", bookingAId);
    expect(bBk).toEqual([]);
  });

  it("3. guest import: 3 households / 5 guests, 1 permitted plus-one; attacker client B sees none of it", async () => {
    const imp = await call("rsvp-import-guests", await jwt(clientA), {
      event_id: eventA,
      fingerprint: `j1-${stamp}`,
      households: [
        { label: "The Adebayos", guests: [
          { display_name: "Kwame Adebayo", function_ids: [fnCeremony, fnReception] },
          { display_name: "Ama Adebayo", function_ids: [fnCeremony, fnReception] },
        ] },
        { label: "The Naidoos", guests: [
          { display_name: "Priya Naidoo", function_ids: [fnReception] },
          { display_name: "Ravi Naidoo", function_ids: [fnCeremony, fnReception] },
        ] },
        { label: "Solo Guest", guests: [
          { display_name: "Lerato Mokoena", function_ids: [fnReception] },
        ] },
      ],
    });
    expect(imp.status, JSON.stringify(imp.json)).toBe(200);
    expect(imp.json).toMatchObject({ imported: true, household_count: 3, guest_count: 5 });

    const { data: hh } = await admin.from("households").select("id, label, guests(id, display_name)").eq("event_id", eventA);
    adebayoHhId = hh!.find((h) => h.label === "The Adebayos")!.id;
    const allGuests = (hh ?? []).flatMap((h) => h.guests as { id: string; display_name: string }[]);
    const leratoGuestId = allGuests.find((g) => g.display_name === "Lerato Mokoena")!.id;

    const { error: entErr } = await admin
      .from("guest_entitlements")
      .update({ plus_one_allowed: true })
      .eq("guest_id", leratoGuestId)
      .eq("function_id", fnReception);
    expect(entErr).toBeNull();

    const { data: bSees } = await clientB.client.from("households").select("id").eq("id", adebayoHhId);
    expect(bSees).toEqual([]);
  });

  it("4. mixed RSVP: the Adebayo household submits per-function answers; some attending, one declined", async () => {
    const { data: guests } = await admin.from("guests").select("id, display_name").eq("household_id", adebayoHhId);
    const kwame = guests!.find((g) => g.display_name === "Kwame Adebayo")!.id;
    const ama = guests!.find((g) => g.display_name === "Ama Adebayo")!.id;

    const pub = await call("rsvp-publish-invitation", await jwt(clientA), { household_id: adebayoHhId });
    expect(pub.status, JSON.stringify(pub.json)).toBe(200);
    const ex = await call("rsvp-exchange-token", null, { token: pub.json.token });
    expect(ex.status, JSON.stringify(ex.json)).toBe(200);

    const sub = await call("rsvp-submit-response", null, {
      session_token: ex.json.session_token,
      responses: [
        { guest_id: kwame, function_id: fnCeremony, answer: "attending", meal: "Beef", expected_revision: 0 },
        { guest_id: kwame, function_id: fnReception, answer: "attending", meal: "Beef", expected_revision: 0 },
        { guest_id: ama, function_id: fnCeremony, answer: "declined", expected_revision: 0 },
        { guest_id: ama, function_id: fnReception, answer: "attending", meal: "Vegetarian", expected_revision: 0 },
      ],
    });
    expect(sub.status, JSON.stringify(sub.json)).toBe(200);
    expect(sub.json.results!.every((r) => !r.conflict)).toBe(true);
    expect(sub.json.counts![fnReception]).toBe(2); // Kwame + Ama attending the reception

    // a declined answer never carries a meal through to storage
    const { data: amaCeremony } = await admin.from("guest_responses").select("answer, meal").eq("guest_id", ama).eq("function_id", fnCeremony).single();
    expect(amaCeremony).toMatchObject({ answer: "declined", meal: null });
  });

  it("5. headcount change approval: after the reception cutoff, a guest's edit only moves the count once the host approves", async () => {
    await admin.from("functions").update({ rsvp_cutoff_at: new Date(Date.now() - 3600_000).toISOString() }).eq("id", fnReception);

    const { data: guests } = await admin.from("guests").select("id, display_name").eq("household_id", adebayoHhId);
    const ama = guests!.find((g) => g.display_name === "Ama Adebayo")!.id;

    // host-facing reception headcount: distinct guests whose counted answer
    // is "attending" (RsvpHostManager counts by answer, not state — a
    // pending change must not silently move the number).
    const receptionAttending = async () => {
      const { count } = await admin
        .from("guest_responses")
        .select("*", { count: "exact", head: true })
        .eq("function_id", fnReception)
        .eq("answer", "attending");
      return count ?? 0;
    };
    expect(await receptionAttending()).toBe(2);

    const pub = await call("rsvp-publish-invitation", await jwt(clientA), { household_id: adebayoHhId });
    const ex = await call("rsvp-exchange-token", null, { token: pub.json.token });
    const req = await call("rsvp-submit-response", null, {
      session_token: ex.json.session_token,
      responses: [{ guest_id: ama, function_id: fnReception, answer: "declined", expected_revision: 1 }],
    });
    expect(req.status, JSON.stringify(req.json)).toBe(200);
    expect(req.json.results![0].change_requested).toBe(true);

    const { data: parked } = await admin.from("guest_responses").select("state, answer, pending_change").eq("guest_id", ama).eq("function_id", fnReception).single();
    expect(parked).toMatchObject({ state: "change_requested", answer: "attending" });
    expect(parked!.pending_change).toMatchObject({ answer: "declined" });
    expect(await receptionAttending()).toBe(2); // not moved yet

    const outsider = await call("rsvp-approve-change", await jwt(clientB), { guest_id: ama, function_id: fnReception, decision: "approve" });
    expect(outsider.status).toBe(403);

    const appr = await call("rsvp-approve-change", await jwt(clientA), { guest_id: ama, function_id: fnReception, decision: "approve" });
    expect(appr.status, JSON.stringify(appr.json)).toBe(200);
    const { data: applied } = await admin.from("guest_responses").select("state, answer, meal, pending_change").eq("guest_id", ama).eq("function_id", fnReception).single();
    expect(applied).toMatchObject({ state: "submitted", answer: "declined", meal: null, pending_change: null });
    expect(await receptionAttending()).toBe(1); // moved on approval
  });

  it("6. fee payment: a STITCHD service fee is recorded on event A — visible to client A, not to client B", async () => {
    const { data: pay, error } = await admin
      .from("budget_payments")
      .insert({ event_id: eventA, label: "STITCHD service fee", amount_cents: 250000, status: "paid", paid_at: new Date().toISOString() })
      .select("id")
      .single();
    expect(error).toBeNull();
    auditEntityIds.push(pay!.id); // budget_payments_audit -> activity_log, no FK cascade

    const { data: aSees } = await clientA.client.from("budget_payments").select("id, amount_cents").eq("id", pay!.id);
    expect(aSees).toEqual([{ id: pay!.id, amount_cents: 250000 }]);
    const { data: bSees } = await clientB.client.from("budget_payments").select("id").eq("id", pay!.id);
    expect(bSees).toEqual([]);
  });

  it("7. reconfirmation: satisfying booking A's obligations drives its readiness to green (100)", async () => {
    const { data: before } = await clientA.client.rpc("booking_readiness", { p_booking_id: bookingAId });
    expect((before as { band: string }).band).not.toBe("green");

    await admin.from("obligations").update({ state: "satisfied" }).eq("booking_id", bookingAId);

    const { data: after } = await clientA.client.rpc("booking_readiness", { p_booking_id: bookingAId });
    expect(after).toMatchObject({ score: 100, band: "green", has_critical_blocker: false });

    const { data: evt } = await clientA.client.rpc("event_readiness", { p_event_id: eventA });
    expect((evt as { assessed_count: number }).assessed_count).toBeGreaterThanOrEqual(1);
  });

  it("8. no-show ticket: a P0 ticket breaches its first-response clock and escalation enqueues a notification", async () => {
    const { data: t, error } = await admin
      .from("tickets")
      .insert({
        event_id: eventA, supplier_id: supplierIds[0], category: "supplier_delay", priority: "critical",
        visibility: "client", created_by: ops1.id, created_by_role: "admin", status: "open",
      })
      .select("id, ref")
      .single();
    expect(error).toBeNull();
    noShowTicketId = t!.id;
    // clock was anchored to created_at by the trigger; force it past due to
    // simulate the breach without waiting 5 real minutes
    await admin.from("tickets").update({ response_due_at: new Date(Date.now() - 60_000).toISOString() }).eq("id", noShowTicketId);

    const { data: escalated, error: escErr } = await admin.rpc("tickets_escalate");
    expect(escErr).toBeNull();
    expect((escalated as { ticket_id: string }[]).some((e) => e.ticket_id === noShowTicketId)).toBe(true);

    const { data: q } = await admin.from("notification_queue").select("template, to_user_id").eq("intent_key", `${noShowTicketId}:escalation:1`);
    expect(q).toHaveLength(1);
    expect(q![0]).toMatchObject({ template: "ticket_escalated", to_user_id: clientA.id });

    const { data: aSees } = await clientA.client.from("tickets").select("id").eq("id", noShowTicketId);
    expect(aSees).toHaveLength(1);
    const { data: bSees } = await supplierBUser.client.from("tickets").select("id").eq("id", noShowTicketId);
    expect(bSees).toEqual([]);
  });

  it("9. authorised Rescue: ops1 proposes a backup, cannot self-approve; a second admin (ops2) can", async () => {
    const create = await call("rescue-request-create", await jwt(ops1), {
      ticket_id: noShowTicketId,
      candidate_name: "Backup Caterer Co",
      availability_confirmed_at: new Date().toISOString(),
      contact_evidence: "WhatsApp confirmation 14:02",
      cost_cents: 300_000,
      capped_spend_cents: 350_000,
    });
    expect(create.status, JSON.stringify(create.json)).toBe(200);
    const rescueRef = create.json.ref as string;
    expect(create.json.decision).toBe("pending"); // proposing, never committing

    const selfApprove = await call("rescue-request-approve", await jwt(ops1), { rescue_ref: rescueRef, decision: "approved" });
    expect(selfApprove.status).toBe(403);

    const approve = await call("rescue-request-approve", await jwt(ops2), { rescue_ref: rescueRef, decision: "approved" });
    expect(approve.status, JSON.stringify(approve.json)).toBe(200);
    expect(approve.json.decision).toBe("approved");

    const { data: row } = await admin.from("rescue_requests").select("decision, approved_by, capped_spend_cents").eq("ref", rescueRef).single();
    expect(row).toMatchObject({ decision: "approved", approved_by: ops2.id, capped_spend_cents: 350_000 });
  });

  it("10. completion + reconciliation: booking A completes, the audit trail carries the run, the attacker still sees nothing", async () => {
    await admin.from("bookings").update({ state: "completed", updated_at: new Date().toISOString() }).eq("id", bookingAId);
    const { data: b } = await clientA.client.from("bookings").select("state").eq("id", bookingAId).single();
    expect(b?.state).toBe("completed");

    // audit evidence exists for the accepted quote and the ticket path
    const { data: quoteAudit } = await admin.from("activity_log").select("id").eq("ref", quoteARef);
    expect(quoteAudit!.length, "expected activity_log rows for the accepted quote").toBeGreaterThan(0);
    const { data: tixAudit } = await admin.from("activity_log").select("id").eq("entity_type", "tickets").limit(1);
    expect(tixAudit!.length).toBeGreaterThan(0);

    // end state: the isolation attackers still see nothing of Event A
    const { data: bBookings } = await clientB.client.from("bookings").select("id").eq("id", bookingAId);
    expect(bBookings).toEqual([]);
    const { data: cGuests } = await supplierCUser.client.from("guests").select("id").eq("household_id", adebayoHhId);
    expect(cGuests).toEqual([]);
    const { data: cReadiness } = await supplierCUser.client.rpc("booking_readiness", { p_booking_id: bookingAId });
    expect(cReadiness).toMatchObject({ score: null, band: "grey" }); // no obligations visible to C
  });
});
