import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// WBS-07 (Part H2): ticket clocks computed and enforced (not just unused
// columns), escalation into the WBS-05 queue, and human-approved Rescue
// with a real no-self-approval rule.
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
const PASSWORD = "TicketClockTest1234!";
const stamp = Date.now();

async function makeUser(tag: string, roleRow?: string) {
  const email = `rls-clock-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  if (roleRow) await admin.from("role_assignments").insert({ user_id: data.user.id, role: roleRow, status: "active" });
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw new Error(`sign-in failed for ${tag}: ${signInErr.message}`);
  return { id: data.user.id as string, client };
}
async function jwtFor(u: { client: SupabaseClient }) {
  return (await u.client.auth.getSession()).data.session?.access_token;
}
async function call(fn: string, jwt: string | undefined, payload: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    body: JSON.stringify(payload),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

let owner: { id: string; client: SupabaseClient };
let adminUser: { id: string; client: SupabaseClient };
let attacker: { id: string; client: SupabaseClient };
let eventId: string;
const userIds: string[] = [];
const eventIds: string[] = [];
const ticketIds: string[] = [];

beforeAll(async () => {
  owner = await makeUser("owner");
  adminUser = await makeUser("admin", "admin");
  attacker = await makeUser("attacker");
  userIds.push(owner.id, adminUser.id, attacker.id);

  const { data: event } = await admin.from("events").insert({ owner_id: owner.id, guest_count: 30 }).select("id").single();
  eventId = event!.id;
  eventIds.push(eventId);
});

afterAll(async () => {
  await admin.from("rescue_requests").delete().in("ticket_id", ticketIds);
  for (const id of ticketIds) await admin.from("notification_queue").delete().like("intent_key", `${id}:%`);
  await admin.from("tickets").delete().in("id", ticketIds);
  for (const id of eventIds) await admin.from("events").delete().eq("id", id);
  await admin.from("role_assignments").delete().eq("user_id", adminUser.id);
  for (const id of userIds) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

async function makeTicket(priority: string, extra: Record<string, unknown> = {}) {
  const { data } = await admin
    .from("tickets")
    .insert({ event_id: eventId, category: "task", priority, visibility: "client", created_by: owner.id, created_by_role: "client", status: "open", ...extra })
    .select("id, ref, created_at, response_due_at, resolution_due_at, next_update_due_at")
    .single();
  ticketIds.push(data!.id);
  return data!;
}

describe("ticket clocks — computed from priority, anchored to created_at", () => {
  it("critical: 5min ack / 15min resolution / 10min next-update", async () => {
    const t = await makeTicket("critical");
    const created = new Date(t.created_at).getTime();
    expect(new Date(t.response_due_at).getTime() - created).toBe(5 * 60000);
    expect(new Date(t.resolution_due_at).getTime() - created).toBe(15 * 60000);
    expect(new Date(t.next_update_due_at).getTime() - created).toBe(10 * 60000);
  });

  it("high: 15min ack / 60min resolution / 30min next-update (wall clock)", async () => {
    const t = await makeTicket("high");
    const created = new Date(t.created_at).getTime();
    expect(new Date(t.response_due_at).getTime() - created).toBe(15 * 60000);
    expect(new Date(t.resolution_due_at).getTime() - created).toBe(60 * 60000);
    expect(new Date(t.next_update_due_at).getTime() - created).toBe(30 * 60000);
  });

  it("low/medium clocks run in business hours, not wall clock (Part H2)", async () => {
    // Pin created_at to a Wednesday noon SAST so the assertion is stable
    // regardless of when the suite runs.
    const wedNoon = "2026-09-09T12:00:00+02:00";
    const t = await makeTicket("low", { created_at: wedNoon });

    const { data: ack } = await admin.rpc("business_hours_add", { p_from: wedNoon, p_minutes: 540 });   // 1 business day
    const { data: plan } = await admin.rpc("business_hours_add", { p_from: wedNoon, p_minutes: 2700 }); // 5 business days
    expect(new Date(t.response_due_at).getTime()).toBe(new Date(ack as string).getTime());
    expect(new Date(t.resolution_due_at).getTime()).toBe(new Date(plan as string).getTime());

    // and it is NOT the old wall-clock value (24h) — 540 business minutes
    // from Wed noon lands next day, but 5 business days is well past 5×24h.
    const created = new Date(t.created_at).getTime();
    expect(new Date(t.resolution_due_at).getTime() - created).toBeGreaterThan(7200 * 60000);
  });

  it("escalating priority on an existing ticket recomputes clocks from the ORIGINAL created_at, not now — no reset to hide a breach", async () => {
    const t = await makeTicket("low");
    // Backdate created_at as if this ticket has been sitting for 2 hours —
    // service-role direct update, simulating time having passed.
    const backdated = new Date(Date.now() - 2 * 60 * 60000).toISOString();
    await admin.from("tickets").update({ created_at: backdated }).eq("id", t.id);

    const { data: escalatedTicket } = await admin.from("tickets").update({ priority: "critical" }).eq("id", t.id).select("response_due_at").single();
    // response_due_at = backdated created_at + 5 minutes, which is well in
    // the past — the breach is visible immediately, not hidden behind a
    // fresh 5-minute grace period counted from the moment of the edit.
    expect(new Date(escalatedTicket!.response_due_at).getTime()).toBeLessThan(Date.now());
  });
});

describe("tickets_escalate() — real breach detection, feeding the WBS-05 queue", () => {
  it("a ticket whose first-response clock has already breached gets escalated and enqueued", async () => {
    const t = await makeTicket("critical");
    await admin.from("tickets").update({ response_due_at: new Date(Date.now() - 60000).toISOString() }).eq("id", t.id);

    const { data: escalated, error } = await admin.rpc("tickets_escalate");
    expect(error).toBeNull();
    expect(escalated?.some((e: { ticket_id: string }) => e.ticket_id === t.id)).toBe(true);

    const { data: updated } = await admin.from("tickets").select("escalation_level").eq("id", t.id).single();
    expect(updated?.escalation_level).toBe(1);

    const { data: queued } = await admin.from("notification_queue").select("id, template").eq("intent_key", `${t.id}:escalation:1`);
    expect(queued).toHaveLength(1);
    expect(queued![0].template).toBe("ticket_escalated");
  });

  it("a ticket with no breached clock is left alone", async () => {
    const t = await makeTicket("low"); // due in 1 day, definitely not breached
    const { data: escalated } = await admin.rpc("tickets_escalate");
    expect(escalated?.some((e: { ticket_id: string }) => e.ticket_id === t.id)).toBe(false);
    const { data: unchanged } = await admin.from("tickets").select("escalation_level").eq("id", t.id).single();
    expect(unchanged?.escalation_level).toBe(0);
  });

  it("a resolved ticket is never escalated even with a breached clock", async () => {
    const t = await makeTicket("critical");
    await admin.from("tickets").update({ response_due_at: new Date(Date.now() - 60000).toISOString(), status: "resolved" }).eq("id", t.id);
    const { data: escalated } = await admin.rpc("tickets_escalate");
    expect(escalated?.some((e: { ticket_id: string }) => e.ticket_id === t.id)).toBe(false);
  });
});

describe("Rescue — proposal, approval, and no-self-approval", () => {
  it("the event owner can propose a rescue candidate", async () => {
    const t = await makeTicket("critical");
    const { status, json } = await call("rescue-request-create", await jwtFor(owner), {
      ticket_id: t.id, candidate_name: "Backup Caterer", availability_confirmed_at: new Date().toISOString(), cost_cents: 500000, capped_spend_cents: 600000,
    });
    expect(status).toBe(200);
    expect(json.decision).toBe("pending");
  });

  it("an unrelated user cannot propose a rescue candidate for someone else's ticket", async () => {
    const t = await makeTicket("critical");
    const { status } = await call("rescue-request-create", await jwtFor(attacker), { ticket_id: t.id, candidate_name: "Forged" });
    expect(status).toBe(403);
  });

  it("admin can approve a request the owner proposed; the owner cannot approve their own proposal", async () => {
    const t = await makeTicket("critical");
    const { json: created } = await call("rescue-request-create", await jwtFor(owner), { ticket_id: t.id, candidate_name: "Backup Florist" });

    const selfApprove = await call("rescue-request-approve", await jwtFor(owner), { rescue_ref: created.ref, decision: "approved" });
    expect(selfApprove.status).toBe(403);
    expect(selfApprove.json.error).toMatch(/cannot also approve/);

    const adminApprove = await call("rescue-request-approve", await jwtFor(adminUser), { rescue_ref: created.ref, decision: "approved" });
    expect(adminApprove.status).toBe(200);
    expect(adminApprove.json.decision).toBe("approved");
  });

  it("a decision, once made, cannot be made again (no double-approval race)", async () => {
    const t = await makeTicket("critical");
    const { json: created } = await call("rescue-request-create", await jwtFor(adminUser), { ticket_id: t.id, candidate_name: "Double Approve Test" });
    const first = await call("rescue-request-approve", await jwtFor(owner), { rescue_ref: created.ref, decision: "declined" });
    expect(first.status).toBe(200);
    const second = await call("rescue-request-approve", await jwtFor(owner), { rescue_ref: created.ref, decision: "approved" });
    expect(second.status).toBe(400);
  });

  it("RLS: an unrelated user cannot see this event's rescue requests at all", async () => {
    const t = await makeTicket("critical");
    await call("rescue-request-create", await jwtFor(owner), { ticket_id: t.id, candidate_name: "Private" });
    const { data } = await attacker.client.from("rescue_requests").select("id").eq("ticket_id", t.id);
    expect(data).toEqual([]);
    const { data: seenByOwner } = await owner.client.from("rescue_requests").select("id").eq("ticket_id", t.id);
    expect(seenByOwner!.length).toBeGreaterThan(0);
  });
});
