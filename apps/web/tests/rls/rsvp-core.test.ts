import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// WBS-03 (RSVP): the full host -> guest loop through the real Edge
// Functions, plus RLS proof that neither table is reachable any other way.
// Same local-only guard and cleanup discipline as the rest of this suite.
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
const PASSWORD = "RsvpFixtureTest1234!";
const stamp = Date.now();

async function makeUser(tag: string) {
  const email = `rls-rsvp-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw new Error(`sign-in failed for ${tag}: ${signInErr.message}`);
  return { id: data.user.id as string, client };
}

async function call(fn: string, jwt: string | null, payload: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

let host: { id: string; client: SupabaseClient };
let attacker: { id: string; client: SupabaseClient };
let hostJwt: string;
let eventId: string;
let functionId: string;
let householdId: string;
let guestId: string;
const userIds: string[] = [];
const eventIds: string[] = [];

beforeAll(async () => {
  host = await makeUser("host");
  attacker = await makeUser("attacker");
  userIds.push(host.id, attacker.id);
  hostJwt = (await host.client.auth.getSession()).data.session!.access_token;

  const { data: event } = await admin.from("events").insert({ owner_id: host.id, guest_count: 2 }).select("id").single();
  if (!event) throw new Error("fixture event creation failed");
  eventId = event.id;
  eventIds.push(eventId);

  const { data: fn } = await admin.from("functions").insert({ event_id: eventId, name: "Reception" }).select("id").single();
  if (!fn) throw new Error("fixture function creation failed");
  functionId = fn.id;
});

afterAll(async () => {
  for (const id of eventIds) {
    // households cascades to guests/guest_entitlements/guest_responses/
    // invitations; guest_sessions has its own FK to households, also
    // cascading — explicit anyway, matching this suite's own established
    // "don't trust cascade silently" lesson from the WBS-02 pass.
    const { data: households } = await admin.from("households").select("id").eq("event_id", id);
    for (const h of households ?? []) {
      await admin.from("guest_sessions").delete().eq("household_id", h.id);
    }
    await admin.from("households").delete().eq("event_id", id);
    await admin.from("functions").delete().eq("event_id", id);
    await admin.from("events").delete().eq("id", id);
  }
  for (const id of userIds) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("rsvp-import-guests", () => {
  it("imports a household with a real guest, entitled to the real function", async () => {
    const fingerprint = `fp-${stamp}`;
    const { status, json } = await call("rsvp-import-guests", hostJwt, {
      event_id: eventId,
      fingerprint,
      households: [{ label: "The Dlaminis", guests: [{ display_name: "Thabo Dlamini", person_type: "adult", function_ids: [functionId] }] }],
    });
    expect(status).toBe(200);
    expect(json).toMatchObject({ imported: true, household_count: 1, guest_count: 1 });

    const { data: households } = await admin.from("households").select("id, label").eq("event_id", eventId);
    expect(households).toHaveLength(1);
    householdId = households![0].id;
    const { data: guests } = await admin.from("guests").select("id").eq("household_id", householdId);
    expect(guests).toHaveLength(1);
    guestId = guests![0].id;
  });

  it("a retried identical import (same fingerprint) is a safe no-op, not a duplicate", async () => {
    const fingerprint = `fp-${stamp}`; // same as above, deliberately
    const { status, json } = await call("rsvp-import-guests", hostJwt, {
      event_id: eventId,
      fingerprint,
      households: [{ label: "The Dlaminis", guests: [{ display_name: "Thabo Dlamini", person_type: "adult", function_ids: [functionId] }] }],
    });
    expect(status).toBe(200);
    expect(json).toMatchObject({ imported: false, already_imported: true, household_count: 1, guest_count: 1 });

    const { data: households } = await admin.from("households").select("id").eq("event_id", eventId);
    expect(households).toHaveLength(1); // still exactly one, not two
  });

  it("a non-owner cannot import guests into someone else's event", async () => {
    const attackerJwt = (await attacker.client.auth.getSession()).data.session!.access_token;
    const { status } = await call("rsvp-import-guests", attackerJwt, {
      event_id: eventId,
      fingerprint: `fp-attacker-${stamp}`,
      households: [{ label: "Forged", guests: [{ display_name: "Nobody", function_ids: [functionId] }] }],
    });
    expect(status).toBe(403);
  });

  it("a forged function_id from another event is rejected", async () => {
    const { data: otherEvent } = await admin.from("events").insert({ owner_id: attacker.id, guest_count: 1 }).select("id").single();
    const { data: otherFn } = await admin.from("functions").insert({ event_id: otherEvent!.id, name: "Someone Else's Wedding" }).select("id").single();
    eventIds.push(otherEvent!.id);

    const { status, json } = await call("rsvp-import-guests", hostJwt, {
      event_id: eventId,
      fingerprint: `fp-forged-fn-${stamp}`,
      households: [{ label: "Should Fail", guests: [{ display_name: "X", function_ids: [otherFn!.id] }] }],
    });
    expect(status).toBe(422);
    expect(json.error).toMatch(/does not belong to this event/);
  });
});

describe("household/guest visibility — host-only, zero anonymous reach", () => {
  it("the host can see their own household and guest", async () => {
    const { data } = await host.client.from("households").select("id").eq("id", householdId);
    expect(data).toHaveLength(1);
  });

  it("an unrelated user cannot see this household, its guests, or its responses", async () => {
    const { data: hh } = await attacker.client.from("households").select("id").eq("id", householdId);
    expect(hh).toEqual([]);
    const { data: gg } = await attacker.client.from("guests").select("id").eq("id", guestId);
    expect(gg).toEqual([]);
    const { data: rr } = await attacker.client.from("guest_responses").select("id").eq("guest_id", guestId);
    expect(rr).toEqual([]);
  });

  it("invitations and guest_sessions have no client-facing policy at all — not even the host reads them directly", async () => {
    const { data: inv, error: invErr } = await host.client.from("invitations").select("id").eq("household_id", householdId);
    expect(invErr).toBeNull();
    expect(inv).toEqual([]); // filtered to nothing, not an error — RLS doing its job

    const { data: sess, error: sessErr } = await host.client.from("guest_sessions").select("id").eq("household_id", householdId);
    expect(sessErr).toBeNull();
    expect(sess).toEqual([]);
  });
});

describe("the real guest loop through rsvp-exchange-token and rsvp-submit-response", () => {
  let rawToken: string;
  let sessionToken: string;

  it("host publishes the invitation and receives a raw token", async () => {
    const { status, json } = await call("rsvp-publish-invitation", hostJwt, { household_id: householdId });
    expect(status).toBe(200);
    expect(typeof json.token).toBe("string");
    expect(json.token.length).toBeGreaterThanOrEqual(64); // 256 bits, hex-encoded
    rawToken = json.token;

    const { data: inv } = await admin.from("invitations").select("token_hash, state, token_version").eq("household_id", householdId).single();
    expect(inv?.state).toBe("published");
    expect(inv?.token_version).toBe(1);
    expect(inv?.token_hash).not.toBe(rawToken); // never stored raw
  });

  it("a garbage token is rejected with a generic, non-enumerating error", async () => {
    const { status, json } = await call("rsvp-exchange-token", null, { token: "not-a-real-token" });
    expect(status).toBe(404);
    expect(json.error).toMatch(/invalid or has expired/);
  });

  it("the real token exchanges for a session and the household's own guests, already recognised", async () => {
    const { status, json } = await call("rsvp-exchange-token", null, { token: rawToken });
    expect(status).toBe(200);
    expect(json.household.id).toBe(householdId);
    expect(json.guests).toHaveLength(1);
    expect(json.guests[0].id).toBe(guestId);
    expect(json.guests[0].guest_entitlements).toHaveLength(1);
    sessionToken = json.session_token;
  });

  it("submitting an attending response with a meal choice records it and returns a live count", async () => {
    const { status, json } = await call("rsvp-submit-response", null, {
      session_token: sessionToken,
      responses: [{ guest_id: guestId, function_id: functionId, answer: "attending", meal: "Beef", expected_revision: 0 }],
    });
    expect(status).toBe(200);
    expect(json.results[0]).toMatchObject({ state: "submitted", revision: 1 });
    expect(json.counts[functionId]).toBe(1);

    const { data: stored } = await admin.from("guest_responses").select("answer, meal, state").eq("guest_id", guestId).eq("function_id", functionId).single();
    expect(stored).toMatchObject({ answer: "attending", meal: "Beef", state: "submitted" });
  });

  it("a stale expected_revision is rejected as a conflict, never silently overwritten", async () => {
    const { status, json } = await call("rsvp-submit-response", null, {
      session_token: sessionToken,
      responses: [{ guest_id: guestId, function_id: functionId, answer: "declined", expected_revision: 0 /* stale — real revision is now 1 */ }],
    });
    expect(status).toBe(409);
    expect(json.results[0]).toMatchObject({ conflict: true });

    const { data: stillAttending } = await admin.from("guest_responses").select("answer, meal").eq("guest_id", guestId).eq("function_id", functionId).single();
    expect(stillAttending).toMatchObject({ answer: "attending", meal: "Beef" }); // untouched
  });

  it("a declined answer never carries a meal choice through, even if the client sends one", async () => {
    const { status } = await call("rsvp-submit-response", null, {
      session_token: sessionToken,
      responses: [{ guest_id: guestId, function_id: functionId, answer: "declined", meal: "Beef", expected_revision: 1 }],
    });
    expect(status).toBe(200);
    const { data: stored } = await admin.from("guest_responses").select("answer, meal").eq("guest_id", guestId).eq("function_id", functionId).single();
    expect(stored).toMatchObject({ answer: "declined", meal: null });
  });

  it("a forged guest_id outside this household is rejected outright", async () => {
    const { data: otherHousehold } = await admin.from("households").insert({ event_id: eventId, label: "Not Yours" }).select("id").single();
    const { data: otherGuest } = await admin.from("guests").insert({ household_id: otherHousehold!.id, display_name: "Stranger" }).select("id").single();

    const { status, json } = await call("rsvp-submit-response", null, {
      session_token: sessionToken,
      responses: [{ guest_id: otherGuest!.id, function_id: functionId, answer: "attending", expected_revision: 0 }],
    });
    expect(status).toBe(403);
    expect(json.error).toMatch(/don't belong to your household/);
  });

  it("re-publishing bumps the version and immediately invalidates the old session on its very next write", async () => {
    const { status: republishStatus } = await call("rsvp-publish-invitation", hostJwt, { household_id: householdId });
    expect(republishStatus).toBe(200);

    const { status } = await call("rsvp-submit-response", null, {
      session_token: sessionToken, // minted under version 1; invitation is now version 2
      responses: [{ guest_id: guestId, function_id: functionId, answer: "attending", expected_revision: 2 }],
    });
    expect(status).toBe(401);
  });
});
