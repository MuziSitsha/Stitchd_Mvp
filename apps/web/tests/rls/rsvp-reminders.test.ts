import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Part F: RSVP reminders before the guest-count cutoff. STITCHD holds no
// guest contact details, so the nudge goes to the host — "the cutoff for
// <function> is in N days and M households still haven't replied." One
// 7-day and one 2-day nudge per function, enqueued into notification_queue,
// deduped by intent key.
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
const PASSWORD = "RsvpReminderTest1234!";
const stamp = Date.now();

async function call(fn: string, jwt: string | null, payload: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    body: JSON.stringify(payload),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

let host: { id: string; client: SupabaseClient };
let hostJwt: string;
let eventId: string;
const userIds: string[] = [];
const eventIds: string[] = [];
const HOST_PHONE = "+27820001111";

// helper: seed a function with N households (each 1 guest), then publish +
// (optionally) submit some of them.
async function seedFunction(name: string, cutoffAt: string | null, opts: { households: number; submitted: number; publish: boolean }) {
  const { data: fn } = await admin.from("functions").insert({ event_id: eventId, name, rsvp_cutoff_at: cutoffAt }).select("id").single();
  const households: { label: string; guests: { display_name: string; function_ids: string[] }[] }[] = [];
  for (let i = 0; i < opts.households; i++) {
    households.push({ label: `${name} HH ${i}`, guests: [{ display_name: `${name} Guest ${i}`, function_ids: [fn!.id] }] });
  }
  // this test seeds far more than 5 imports per event — clear the per-event
  // guest_import budget between each so rsvp-import-guests' rate limit (5/hr,
  // Part K1) isn't what fails the fixture.
  await admin.from("rate_limit_hits").delete().eq("bucket", "guest_import").eq("key", eventId);
  const imp = await call("rsvp-import-guests", hostJwt, { event_id: eventId, fingerprint: `rem-${name}-${stamp}`, households });
  if (imp.status !== 200) throw new Error(`import for ${name} failed: ${imp.status} ${JSON.stringify(imp.json)}`);

  const { data: hhRows } = await admin.from("households").select("id, label, guests(id)").eq("event_id", eventId).like("label", `${name} HH %`);
  for (let i = 0; i < (hhRows ?? []).length; i++) {
    const hh = hhRows![i];
    if (opts.publish) await admin.from("invitations").update({ state: "published", token_version: 1 }).eq("household_id", hh.id);
    if (i < opts.submitted) {
      const gid = (hh.guests as { id: string }[])[0].id;
      await admin.from("guest_responses").update({ state: "submitted", answer: "attending", revision: 1 }).eq("guest_id", gid).eq("function_id", fn!.id);
    }
  }
  return fn!.id as string;
}

beforeAll(async () => {
  // cron jobs (incl. rsvp-reminders) are paused for the whole run by
  // tests/global-setup.ts.
  const email = `rls-reminder-host-${stamp}@stitchd.test`;
  const { data } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  userIds.push(data!.user!.id);
  host = { id: data!.user!.id, client: createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } }) };
  await host.client.auth.signInWithPassword({ email, password: PASSWORD });
  hostJwt = (await host.client.auth.getSession()).data.session!.access_token;
  await admin.from("profiles").update({ phone: HOST_PHONE }).eq("id", host.id);

  const { data: ev } = await admin.from("events").insert({ owner_id: host.id, guest_count: 10 }).select("id").single();
  eventId = ev!.id;
  eventIds.push(eventId);
});

afterAll(async () => {
  for (const id of eventIds) {
    const { data: fns } = await admin.from("functions").select("id").eq("event_id", id);
    for (const f of fns ?? []) await admin.from("notification_queue").delete().eq("ref", f.id);
    const { data: hh } = await admin.from("households").select("id").eq("event_id", id);
    for (const h of hh ?? []) {
      await admin.from("guest_sessions").delete().eq("household_id", h.id);
      await admin.from("rate_limit_hits").delete().eq("key", h.id);
    }
    await admin.from("households").delete().eq("event_id", id);
    await admin.from("rate_limit_hits").delete().eq("key", id);
    await admin.from("functions").delete().eq("event_id", id);
    await admin.from("events").delete().eq("id", id);
  }
  for (const id of userIds) {
    await admin.from("notification_queue").delete().eq("to_user_id", id);
    await admin.from("message_log").delete().eq("to_user_id", id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("rsvp_enqueue_reminders()", () => {
  it("enqueues a 7-day nudge to the host for a function 5 days out with an unanswered household", async () => {
    const fnId = await seedFunction("Ceremony", daysFromNow(5), { households: 3, submitted: 1, publish: true });

    const { data: fired } = await admin.rpc("rsvp_enqueue_reminders");
    const row = (fired as { function_id: string; marker: string; outstanding: number }[]).find((r) => r.function_id === fnId);
    expect(row).toMatchObject({ marker: "7d", outstanding: 2 });

    const { data: q } = await admin.from("notification_queue").select("*").eq("intent_key", `rsvp_reminder:${fnId}:7d`).single();
    expect(q).toMatchObject({
      template: "rsvp_reminder",
      to_user_id: host.id,
      to_phone: HOST_PHONE,
      ref: fnId,
    });
    expect(q!.vars).toMatchObject({ function: "Ceremony", days: "7", outstanding: "2" });
  });

  it("is idempotent — a second scan does not enqueue a duplicate", async () => {
    const { data: fnRow } = await admin.from("functions").select("id").eq("event_id", eventId).eq("name", "Ceremony").single();
    const before = await admin.from("notification_queue").select("id", { count: "exact", head: true }).eq("intent_key", `rsvp_reminder:${fnRow!.id}:7d`);
    await admin.rpc("rsvp_enqueue_reminders");
    const after = await admin.from("notification_queue").select("id", { count: "exact", head: true }).eq("intent_key", `rsvp_reminder:${fnRow!.id}:7d`);
    expect(after.count).toBe(before.count);
    expect(after.count).toBe(1);
  });

  it("enqueues the 2-day nudge (not the 7-day one) for a function inside 2 days", async () => {
    const fnId = await seedFunction("Reception", daysFromNow(1), { households: 2, submitted: 0, publish: true });

    await admin.rpc("rsvp_enqueue_reminders");
    const { data: twoDay } = await admin.from("notification_queue").select("vars").eq("intent_key", `rsvp_reminder:${fnId}:2d`).maybeSingle();
    const { data: sevenDay } = await admin.from("notification_queue").select("id").eq("intent_key", `rsvp_reminder:${fnId}:7d`).maybeSingle();
    expect(twoDay).toBeTruthy();
    expect(twoDay!.vars).toMatchObject({ days: "2", outstanding: "2" });
    expect(sevenDay).toBeNull();
  });

  it("says nothing when every household has already submitted", async () => {
    const fnId = await seedFunction("Brunch", daysFromNow(4), { households: 2, submitted: 2, publish: true });
    const { data: fired } = await admin.rpc("rsvp_enqueue_reminders");
    expect((fired as { function_id: string }[]).some((r) => r.function_id === fnId)).toBe(false);
    const { count } = await admin.from("notification_queue").select("id", { count: "exact", head: true }).like("intent_key", `rsvp_reminder:${fnId}:%`);
    expect(count).toBe(0);
  });

  it("ignores functions with the cutoff more than 7 days out, in the past, or unset", async () => {
    const far = await seedFunction("Far", daysFromNow(20), { households: 1, submitted: 0, publish: true });
    const past = await seedFunction("Past", daysFromNow(-1), { households: 1, submitted: 0, publish: true });
    const none = await seedFunction("NoCutoff", null, { households: 1, submitted: 0, publish: true });

    await admin.rpc("rsvp_enqueue_reminders");
    for (const fnId of [far, past, none]) {
      const { count } = await admin.from("notification_queue").select("id", { count: "exact", head: true }).like("intent_key", `rsvp_reminder:${fnId}:%`);
      expect(count, `function ${fnId} should not have a reminder`).toBe(0);
    }
  });

  it("does not count households whose invitation was never published", async () => {
    const fnId = await seedFunction("Unpublished", daysFromNow(3), { households: 2, submitted: 0, publish: false });
    const { data: fired } = await admin.rpc("rsvp_enqueue_reminders");
    expect((fired as { function_id: string }[]).some((r) => r.function_id === fnId)).toBe(false);
  });
});
