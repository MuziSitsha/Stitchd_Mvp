import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// WBS-02: functions, bookings, event_members, and the atomic
// transfer_event_ownership RPC. Same local-only guard and cleanup
// discipline as the rest of this suite.
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
const PASSWORD = "WBS02FixtureTest1234!";
const stamp = Date.now();

async function makeUser(tag: string) {
  const email = `rls-wbs02-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw new Error(`sign-in failed for ${tag}: ${signInErr.message}`);
  return { id: data.user.id as string, email, client };
}

let owner: { id: string; email: string; client: SupabaseClient };
let attacker: { id: string; email: string; client: SupabaseClient };
let partnerCandidate: { id: string; email: string; client: SupabaseClient };
let eventId: string;
let functionId: string;
const userIds: string[] = [];
const eventIds: string[] = [];

beforeAll(async () => {
  owner = await makeUser("owner");
  attacker = await makeUser("attacker");
  partnerCandidate = await makeUser("partner-candidate");
  userIds.push(owner.id, attacker.id, partnerCandidate.id);

  const { data: event } = await admin.from("events").insert({ owner_id: owner.id, guest_count: 80 }).select("id").single();
  if (!event) throw new Error("fixture event creation failed");
  eventId = event.id;
  eventIds.push(eventId);

  const { data: fn } = await admin.from("functions").insert({ event_id: eventId, name: "Reception" }).select("id").single();
  if (!fn) throw new Error("fixture function creation failed");
  functionId = fn.id;
});

afterAll(async () => {
  for (const id of eventIds) {
    await admin.from("event_members").delete().eq("event_id", id);
    await admin.from("functions").delete().eq("event_id", id);
    await admin.from("events").delete().eq("id", id);
  }
  // Defensive, given the message_log gotcha found in this same file's
  // nested afterAll: auth.admin.deleteUser fails opaquely (a bare 500, no
  // useful error body) if anything with a no-cascade FK to auth.users
  // still references the id, and error-checking that failure here so it's
  // at least visible instead of a second silent residue.
  for (const id of userIds) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("functions — event-scoped visibility, same idiom as events itself", () => {
  it("the owner can see and create functions on their own event", async () => {
    const { data: seen } = await owner.client.from("functions").select("id").eq("id", functionId);
    expect(seen).toHaveLength(1);

    const { data: created, error } = await owner.client.from("functions").insert({ event_id: eventId, name: "Ceremony" }).select("id");
    expect(error).toBeNull();
    expect(created).toHaveLength(1);
  });

  it("an unrelated user cannot see or create functions on someone else's event", async () => {
    const { data: seen } = await attacker.client.from("functions").select("id").eq("id", functionId);
    expect(seen).toEqual([]);

    const { data, error } = await attacker.client.from("functions").insert({ event_id: eventId, name: "Forged" }).select("id");
    expect(data).toBeFalsy();
    expect(error).not.toBeNull();
  });
});

describe("event_members — read-your-own-membership only", () => {
  it("the owner sees their own membership row (seeded by the migration backfill / matching a real created event)", async () => {
    const { data } = await owner.client.from("event_members").select("role, status").eq("event_id", eventId).eq("user_id", owner.id);
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({ role: "owner", status: "active" });
  });

  it("an unrelated user cannot see another event's membership rows", async () => {
    const { data } = await attacker.client.from("event_members").select("id").eq("event_id", eventId);
    expect(data).toEqual([]);
  });

  it("event_members has no client-facing insert/update policy — membership changes only through transfer_event_ownership", async () => {
    const { data, error } = await owner.client
      .from("event_members")
      .insert({ event_id: eventId, user_id: owner.id, role: "partner", status: "active" })
      .select("id");
    expect(data).toBeFalsy();
    expect(error).not.toBeNull();
  });
});

describe("transfer_event_ownership — atomic, owner-or-admin only", () => {
  it("a non-owner cannot transfer ownership of someone else's event", async () => {
    const { error } = await attacker.client.rpc("transfer_event_ownership", { p_event_id: eventId, p_new_owner_id: attacker.id });
    expect(error).not.toBeNull();

    const { data: unchanged } = await admin.from("events").select("owner_id").eq("id", eventId).single();
    expect(unchanged?.owner_id).toBe(owner.id);
  });

  it("the real owner can transfer ownership, and the invariants hold after: exactly one active owner, old owner's grant revoked, events.owner_id updated", async () => {
    const { error } = await owner.client.rpc("transfer_event_ownership", { p_event_id: eventId, p_new_owner_id: partnerCandidate.id });
    expect(error).toBeNull();

    const { data: eventRow } = await admin.from("events").select("owner_id").eq("id", eventId).single();
    expect(eventRow?.owner_id).toBe(partnerCandidate.id);

    const { data: members } = await admin.from("event_members").select("user_id, role, status").eq("event_id", eventId).eq("role", "owner");
    const active = members?.filter((m) => m.status === "active") ?? [];
    expect(active).toHaveLength(1);
    expect(active[0].user_id).toBe(partnerCandidate.id);

    const revokedOld = members?.find((m) => m.user_id === owner.id);
    expect(revokedOld?.status).toBe("revoked");

    // Access itself moved: the old owner has lost read access to the event
    // they no longer own; the new owner has gained it. Not just a column
    // flip — the thing the column flip is actually supposed to mean.
    const { data: oldOwnerSees } = await owner.client.from("events").select("id").eq("id", eventId);
    expect(oldOwnerSees).toEqual([]);
    const { data: newOwnerSees } = await partnerCandidate.client.from("events").select("id").eq("id", eventId);
    expect(newOwnerSees).toHaveLength(1);
  });
});

describe("bookings — created live by quotes-respond on real accept, not just backfilled history", () => {
  let supplierUser: { id: string; email: string; client: SupabaseClient };
  let supplierId: string;
  let ticketEventId: string;
  let ticketId: string;
  let quoteRef: string;
  let quoteVersionId: string;

  beforeAll(async () => {
    supplierUser = await makeUser("booking-supplier");
    userIds.push(supplierUser.id);

    // partnerCandidate already owns eventId after the transfer test above
    // (events_one_per_owner), and owner was freed up by that same transfer
    // — so owner is exactly who's available to own this second fixture
    // event, provided describe blocks in this file run in declaration
    // order (Vitest's default within a single file).
    const { data: bookingEvent } = await admin.from("events").insert({ owner_id: owner.id, guest_count: 60 }).select("id").maybeSingle();
    if (!bookingEvent) {
      // events_one_per_owner: owner may already be free (post-transfer) or
      // not depending on suite ordering — fall back to a fresh user if so.
      const fallbackOwner = await makeUser("booking-event-owner");
      userIds.push(fallbackOwner.id);
      const { data: retryEvent } = await admin.from("events").insert({ owner_id: fallbackOwner.id, guest_count: 60 }).select("id").single();
      if (!retryEvent) throw new Error("fixture booking event creation failed even with a fresh owner");
      ticketEventId = retryEvent.id;
    } else {
      ticketEventId = bookingEvent.id;
    }
    eventIds.push(ticketEventId);

    const { data: supplier } = await admin
      .from("suppliers")
      .insert({ profile_id: supplierUser.id, category: "photography", name: `RLS WBS02 Photographer ${stamp}`, status: "active" })
      .select("id")
      .single();
    if (!supplier) throw new Error("fixture supplier creation failed");
    supplierId = supplier.id;

    const { data: ticket } = await admin
      .from("supplier_tickets")
      .insert({ event_id: ticketEventId, supplier_id: supplierId, requested_by: owner.id, status: "pending" })
      .select("id")
      .single();
    if (!ticket) throw new Error("fixture supplier_ticket creation failed");
    ticketId = ticket.id;

    const { data: quote } = await admin.from("quotes").insert({ ticket_id: ticketId, status: "sent", current_version: 1 }).select("id, ref").single();
    if (!quote) throw new Error("fixture quote creation failed");
    quoteRef = quote.ref;

    const { data: version } = await admin
      .from("quote_versions")
      .insert({ quote_id: quote.id, version: 1, total_cents: 900000, created_by: supplierUser.id })
      .select("id")
      .single();
    if (!version) throw new Error("fixture quote_version creation failed");
    quoteVersionId = version.id;
  });

  afterAll(async () => {
    // Explicit, ordered, and error-checked — found the hard way in this
    // same test file: quotes -> quote_versions has no ON DELETE CASCADE
    // (unlike supplier_tickets -> quotes, which does), so deleting only
    // `suppliers` and trusting cascade to reach quote_versions silently
    // stopped short. And the real quotes-respond call above triggers a
    // real notify(), which writes a message_log row with no cascade from
    // auth.users at all — without deleting it explicitly first,
    // auth.admin.deleteUser fails with an opaque 500 and leaves a stale
    // account behind, which is exactly what happened here before this fix.
    const steps: Array<[string, () => Promise<{ error: { message: string } | null }>]> = [
      ["message_log", () => admin.from("message_log").delete().eq("to_user_id", supplierUser.id)],
      ["bookings", () => admin.from("bookings").delete().eq("quote_version_id", quoteVersionId)],
      ["quote_versions", () => admin.from("quote_versions").delete().eq("id", quoteVersionId)],
      ["quotes", () => admin.from("quotes").delete().eq("ref", quoteRef)],
      ["supplier_tickets", () => admin.from("supplier_tickets").delete().eq("id", ticketId)],
      ["suppliers", () => admin.from("suppliers").delete().eq("id", supplierId)],
    ];
    for (const [label, run] of steps) {
      const { error } = await run();
      if (error) console.error(`cleanup step "${label}" failed:`, error.message);
    }
  });

  it("accepting a quote via the real quotes-respond edge function creates exactly one booking row", async () => {
    // Whichever account actually owns ticketEventId by the time this runs
    // (see the fixture's fallback above) is the one that must call accept.
    const { data: eventRow } = await admin.from("events").select("owner_id").eq("id", ticketEventId).single();
    const callerClient = eventRow?.owner_id === owner.id ? owner.client : partnerCandidate.client;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/quotes-respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${(await callerClient.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({ quote_ref: quoteRef, decision: "accept" }),
    });
    expect(res.status).toBe(200);

    const { data: booking } = await admin.from("bookings").select("state, confirmed_at").eq("quote_version_id", quoteVersionId).maybeSingle();
    expect(booking?.state).toBe("confirmed");
    expect(booking?.confirmed_at).not.toBeNull();

    const { data: ticketRow } = await admin.from("supplier_tickets").select("status").eq("id", ticketId).single();
    expect(ticketRow?.status).toBe("confirmed");
  });
});
