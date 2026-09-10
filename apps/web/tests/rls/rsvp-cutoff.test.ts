import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Part F2 completion: the guest-count cutoff and the post-cutoff change
// workflow. "Corrections stay open until cutoff. After cutoff, the guest
// submits a change request for host approval... only approval changes
// counts."
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
const PASSWORD = "RsvpCutoffTest1234!";
const stamp = Date.now();

async function call(fn: string, jwt: string | null, payload: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    body: JSON.stringify(payload),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

let host: { id: string; client: SupabaseClient };
let hostJwt: string;
let eventId: string;
let functionId: string;
let householdId: string;
let guestId: string;
let sessionToken: string;
const userIds: string[] = [];
const eventIds: string[] = [];

beforeAll(async () => {
  const email = `rls-cutoff-host-${stamp}@stitchd.test`;
  const { data } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  userIds.push(data!.user!.id);
  host = { id: data!.user!.id, client: createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } }) };
  await host.client.auth.signInWithPassword({ email, password: PASSWORD });
  hostJwt = (await host.client.auth.getSession()).data.session!.access_token;

  const { data: ev } = await admin.from("events").insert({ owner_id: host.id, guest_count: 2 }).select("id").single();
  eventId = ev!.id;
  eventIds.push(eventId);
  // cutoff already in the past
  const { data: fn } = await admin.from("functions").insert({ event_id: eventId, name: "Reception", rsvp_cutoff_at: new Date(Date.now() - 86400000).toISOString() }).select("id").single();
  functionId = fn!.id;

  await call("rsvp-import-guests", hostJwt, {
    event_id: eventId,
    fingerprint: `fp-cutoff-${stamp}`,
    households: [{ label: "The Post-Cutoff Family", guests: [{ display_name: "Grace Hopper", function_ids: [functionId] }] }],
  });
  const { data: hh } = await admin.from("households").select("id").eq("event_id", eventId).single();
  householdId = hh!.id;
  const { data: g } = await admin.from("guests").select("id").eq("household_id", householdId).single();
  guestId = g!.id;

  // A submitted answer BEFORE we test the cutoff path (seed directly so the
  // cutoff being in the past doesn't block this initial submit).
  await admin.from("guest_responses").update({ state: "submitted", answer: "attending", meal: "Beef", revision: 1 }).eq("guest_id", guestId).eq("function_id", functionId);

  const { json: published } = await call("rsvp-publish-invitation", hostJwt, { household_id: householdId });
  const { json: exchange } = await call("rsvp-exchange-token", null, { token: published.token });
  sessionToken = exchange.session_token;
});

afterAll(async () => {
  for (const id of eventIds) {
    const { data: households } = await admin.from("households").select("id").eq("event_id", id);
    for (const h of households ?? []) {
      await admin.from("guest_sessions").delete().eq("household_id", h.id);
      await admin.from("rate_limit_hits").delete().eq("bucket", "rsvp_write").eq("key", h.id);
    }
    await admin.from("households").delete().eq("event_id", id);
    await admin.from("rate_limit_hits").delete().eq("bucket", "guest_import").eq("key", id);
    await admin.from("functions").delete().eq("event_id", id);
    await admin.from("events").delete().eq("id", id);
  }
  for (const id of userIds) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("post-cutoff RSVP changes", () => {
  it("a guest editing a submitted answer after the cutoff parks it as a change request, leaving the counted answer alone", async () => {
    const { status, json } = await call("rsvp-submit-response", null, {
      session_token: sessionToken,
      responses: [{ guest_id: guestId, function_id: functionId, answer: "declined", expected_revision: 1 }],
    });
    expect(status).toBe(200);
    expect(json.results[0].change_requested).toBe(true);

    const { data: stored } = await admin.from("guest_responses").select("state, answer, meal, pending_change").eq("guest_id", guestId).eq("function_id", functionId).single();
    expect(stored?.state).toBe("change_requested");
    expect(stored?.answer).toBe("attending"); // the COUNTED answer is untouched
    expect(stored?.pending_change).toMatchObject({ answer: "declined" });
  });

  it("the host declining the change discards it and restores the submitted state", async () => {
    const res = await call("rsvp-approve-change", hostJwt, { guest_id: guestId, function_id: functionId, decision: "decline" });
    expect(res.status).toBe(200);
    const { data: stored } = await admin.from("guest_responses").select("state, answer, pending_change").eq("guest_id", guestId).eq("function_id", functionId).single();
    expect(stored).toMatchObject({ state: "submitted", answer: "attending", pending_change: null });
  });

  it("a fresh change request, then the host approving it, applies the pending answer and bumps the revision", async () => {
    // re-request
    await call("rsvp-submit-response", null, {
      session_token: sessionToken,
      responses: [{ guest_id: guestId, function_id: functionId, answer: "declined", expected_revision: 1 }],
    });
    const { data: before } = await admin.from("guest_responses").select("revision").eq("guest_id", guestId).eq("function_id", functionId).single();

    const res = await call("rsvp-approve-change", hostJwt, { guest_id: guestId, function_id: functionId, decision: "approve" });
    expect(res.status).toBe(200);

    const { data: after } = await admin.from("guest_responses").select("state, answer, meal, pending_change, revision").eq("guest_id", guestId).eq("function_id", functionId).single();
    expect(after).toMatchObject({ state: "submitted", answer: "declined", meal: null, pending_change: null });
    expect(after!.revision).toBe(before!.revision + 1);
  });

  it("an unrelated user cannot approve a change on someone else's event", async () => {
    // put it back into change_requested first
    await call("rsvp-submit-response", null, {
      session_token: sessionToken,
      responses: [{ guest_id: guestId, function_id: functionId, answer: "attending", meal: "Fish", expected_revision: 1 }],
    });
    const { data: outsider } = await admin.auth.admin.createUser({ email: `rls-cutoff-outsider-${stamp}@stitchd.test`, password: PASSWORD, email_confirm: true });
    userIds.push(outsider!.user!.id);
    const oc = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    await oc.auth.signInWithPassword({ email: `rls-cutoff-outsider-${stamp}@stitchd.test`, password: PASSWORD });
    const res = await call("rsvp-approve-change", (await oc.auth.getSession()).data.session!.access_token, { guest_id: guestId, function_id: functionId, decision: "approve" });
    expect(res.status).toBe(403);
  });
});
