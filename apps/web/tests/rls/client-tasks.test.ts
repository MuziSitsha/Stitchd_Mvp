import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Merc's own testing feedback: "the Tasks are not linked to anything, if u
// click them they just say completed when it should create a ticket or
// move it to whom responsible, remember no dead tickets." A client's
// personal task list is now backed by real tickets (category = 'task'):
// the client alone can create and complete them, they never enter the
// escalation pipeline, and an isolation attacker sees none of it.
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
const PASSWORD = "ClientTasksTest1234!";
const stamp = Date.now();

async function makeUser(tag: string) {
  const email = `rls-tasks-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error: e } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (e) throw new Error(`sign-in failed for ${tag}: ${e.message}`);
  return { id: data.user.id as string, client };
}
async function jwt(u: { client: SupabaseClient }) {
  return (await u.client.auth.getSession()).data.session!.access_token;
}
async function call(fn: string, token: string, payload: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

let owner: { id: string; client: SupabaseClient };
let attacker: { id: string; client: SupabaseClient };
let eventId: string;
let taskId: string;
let taskRef: string;
const userIds: string[] = [];
const eventIds: string[] = [];

beforeAll(async () => {
  owner = await makeUser("owner");
  attacker = await makeUser("attacker");
  userIds.push(owner.id, attacker.id);
  const { data: event } = await admin.from("events").insert({ owner_id: owner.id, guest_count: 10 }).select("id").single();
  eventId = event!.id;
  eventIds.push(eventId);
});

afterAll(async () => {
  for (const id of eventIds) {
    const { data: tix } = await admin.from("tickets").select("id").eq("event_id", id);
    for (const t of tix ?? []) await admin.from("notification_queue").delete().like("intent_key", `${t.id}:%`);
    await admin.from("tickets").delete().eq("event_id", id);
    await admin.from("events").delete().eq("id", id);
  }
  for (const id of userIds) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("client tasks — real tickets, not a client-side toggle", () => {
  it("the owner can create a category='task' ticket for their own event directly (no Edge Function needed)", async () => {
    const { data, error } = await owner.client
      .from("tickets")
      .insert({
        event_id: eventId, category: "task", visibility: "client",
        created_by: owner.id, created_by_role: "client",
        title: "Send remaining invites", note: "The cousins still haven't had theirs.",
        assigned_label: "Nadine", due_at: new Date(Date.now() + 3 * 86400000).toISOString(), priority: "medium",
      })
      .select("id, ref, status")
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ status: "open" });
    taskId = data!.id;
    taskRef = data!.ref;
  });

  it("an isolation attacker cannot create a task against someone else's event, and cannot see this one", async () => {
    const { data, error } = await attacker.client
      .from("tickets")
      .insert({ event_id: eventId, category: "task", visibility: "client", created_by: attacker.id, created_by_role: "client", title: "Sneaky task" })
      .select("id");
    expect(data).toBeFalsy();
    expect(error).not.toBeNull();

    const { data: seen } = await attacker.client.from("tickets").select("id").eq("id", taskId);
    expect(seen).toEqual([]);
  });

  it("only a 'task' category gets the client-driven two-state loop — a client raising a real dispute still can't resolve it themselves", async () => {
    // 20260828130000_client_tickets.sql already lets a client raise any
    // category ticket about their own event — that's real and unrelated to
    // this pass. What's new here is category = 'task' specifically getting
    // a client-drivable lifecycle; every other category still needs
    // supplier/admin to actually resolve it (a client can only reopen).
    const { data: dispute, error } = await owner.client
      .from("tickets")
      .insert({ event_id: eventId, category: "dispute", visibility: "client", created_by: owner.id, created_by_role: "client" })
      .select("ref")
      .single();
    expect(error).toBeNull();
    const res = await call("tickets-transition", await jwt(owner), { ticket_ref: dispute!.ref, to_status: "resolved", reason: "trying to self-resolve a real dispute" });
    expect(res.status).toBe(403);
    await admin.from("tickets").delete().eq("ref", dispute!.ref);
  });

  it("the owner can resolve their own task via tickets-transition without a resolution_summary prompt round-trip, and reopen it", async () => {
    const resolve = await call("tickets-transition", await jwt(owner), { ticket_ref: taskRef, to_status: "resolved", reason: "Marked done" });
    expect(resolve.status, JSON.stringify(resolve.json)).toBe(200);
    const { data: afterResolve } = await admin.from("tickets").select("status, resolution_summary").eq("id", taskId).single();
    expect(afterResolve).toMatchObject({ status: "resolved", resolution_summary: "Marked done" });

    const reopen = await call("tickets-transition", await jwt(owner), { ticket_ref: taskRef, to_status: "open", reason: "Reopened from the task list" });
    expect(reopen.status, JSON.stringify(reopen.json)).toBe(200);
    const { data: afterReopen } = await admin.from("tickets").select("status").eq("id", taskId).single();
    expect(afterReopen?.status).toBe("open");
  });

  it("an attacker cannot transition someone else's task", async () => {
    const res = await call("tickets-transition", await jwt(attacker), { ticket_ref: taskRef, to_status: "resolved", reason: "nice try" });
    expect(res.status).toBe(403);
  });

  it("resolving a task never queues a dispute_update notification (it's a personal to-do, not a support escalation)", async () => {
    await call("tickets-transition", await jwt(owner), { ticket_ref: taskRef, to_status: "resolved", reason: "Marked done" });
    const { count } = await admin.from("message_log").select("*", { count: "exact", head: true }).eq("ref", taskRef);
    expect(count).toBe(0);
  });

  it("tickets_escalate() ignores task-category tickets even when badly overdue", async () => {
    await admin.from("tickets").update({ status: "open", response_due_at: new Date(Date.now() - 3600_000).toISOString() }).eq("id", taskId);
    const { data: escalated, error } = await admin.rpc("tickets_escalate");
    expect(error).toBeNull();
    expect((escalated as { ticket_id: string }[]).some((e) => e.ticket_id === taskId)).toBe(false);
    const { data: after } = await admin.from("tickets").select("escalation_level").eq("id", taskId).single();
    expect(after?.escalation_level).toBe(0);
  });
});
