import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Part H2: P2/P3 ticket targets are business time — "4 business hours",
// "2 business days". business_hours_add() advances a timestamp only through
// Mon–Fri 08:00–17:00 Africa/Johannesburg; tickets_set_clocks() uses it for
// medium/low and leaves critical/high on wall-clock minutes.
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
const stamp = Date.now();
const PASSWORD = "BizHoursTest1234!";

// SAST wall-time helper: build an ISO string with the +02:00 offset.
const sast = (s: string) => `${s}+02:00`;
async function bizAdd(fromSast: string, minutes: number): Promise<string> {
  const { data, error } = await admin.rpc("business_hours_add", { p_from: sast(fromSast), p_minutes: minutes });
  if (error) throw new Error(error.message);
  return data as string;
}
// render a timestamptz back into SAST "YYYY-MM-DD HH:MM"
const inSast = (iso: string) =>
  new Date(iso).toLocaleString("sv-SE", { timeZone: "Africa/Johannesburg" }).slice(0, 16);

let host: { id: string; client: SupabaseClient };
let eventId: string;
const userIds: string[] = [];
const eventIds: string[] = [];
const ticketIds: string[] = [];

beforeAll(async () => {
  const email = `rls-bizhours-${stamp}@stitchd.test`;
  const { data } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  userIds.push(data!.user!.id);
  host = { id: data!.user!.id, client: createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } }) };
  await host.client.auth.signInWithPassword({ email, password: PASSWORD });
  await admin.from("role_assignments").insert({ user_id: host.id, role: "admin", status: "active" });
  const { data: ev } = await admin.from("events").insert({ owner_id: host.id, guest_count: 2 }).select("id").single();
  eventId = ev!.id;
  eventIds.push(eventId);
});

afterAll(async () => {
  for (const id of ticketIds) {
    await admin.from("notification_queue").delete().like("intent_key", `${id}:%`);
    await admin.from("activity_log").delete().eq("entity_id", id);
    await admin.from("tickets").delete().eq("id", id);
  }
  for (const id of eventIds) await admin.from("events").delete().eq("id", id);
  for (const id of userIds) {
    await admin.from("role_assignments").delete().eq("user_id", id);
    await admin.from("activity_log").delete().eq("actor_id", id);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

async function makeTicket(priority: string, createdAtSast: string) {
  const { data, error } = await admin
    .from("tickets")
    .insert({
      event_id: eventId, category: "guest", priority, visibility: "internal",
      created_by: host.id, created_by_role: "admin", status: "open",
      created_at: sast(createdAtSast),
    })
    .select("id, response_due_at, next_update_due_at, resolution_due_at")
    .single();
  if (error) throw new Error(error.message);
  ticketIds.push(data!.id);
  return data!;
}

describe("business_hours_add()", () => {
  it("advances within a working day", async () => {
    // Wed 2026-09-09 09:00 + 4 business hours -> Wed 13:00
    expect(inSast(await bizAdd("2026-09-09 09:00:00", 240))).toBe("2026-09-09 13:00");
  });

  it("rolls a Friday-afternoon start across the weekend", async () => {
    // Fri 2026-09-11 16:00 + 4 business hours -> 1h Fri + 3h Mon = Mon 11:00
    expect(inSast(await bizAdd("2026-09-11 16:00:00", 240))).toBe("2026-09-14 11:00");
  });

  it("starts from Monday 08:00 when the clock starts on a weekend", async () => {
    // Sat 2026-09-12 10:00 + 1 business hour -> Mon 09:00
    expect(inSast(await bizAdd("2026-09-12 10:00:00", 60))).toBe("2026-09-14 09:00");
  });

  it("treats a full business day (540 min) as 08:00 -> 17:00", async () => {
    expect(inSast(await bizAdd("2026-09-07 08:00:00", 540))).toBe("2026-09-07 17:00");
  });

  it("clamps a before-hours start to the window open", async () => {
    // Wed 06:00 + 60 min -> Wed 09:00 (window opens 08:00)
    expect(inSast(await bizAdd("2026-09-09 06:00:00", 60))).toBe("2026-09-09 09:00");
  });

  it("returns the input unchanged for 0 or negative minutes", async () => {
    expect(inSast(await bizAdd("2026-09-09 12:00:00", 0))).toBe("2026-09-09 12:00");
    expect(inSast(await bizAdd("2026-09-09 12:00:00", -99))).toBe("2026-09-09 12:00");
  });
});

describe("tickets_set_clocks() with business hours", () => {
  it("a P2 raised Friday 16:00 doesn't breach first response until Monday", async () => {
    const t = await makeTicket("medium", "2026-09-11 16:00:00");
    expect(inSast(t.response_due_at)).toBe("2026-09-14 11:00");   // 4 business hours
    expect(inSast(t.next_update_due_at)).toBe("2026-09-14 16:00"); // 1 business day
    expect(inSast(t.resolution_due_at)).toBe("2026-09-15 16:00");  // 2 business days
  });

  it("a P3 raised Friday 16:00 gets a one-business-day first response", async () => {
    const t = await makeTicket("low", "2026-09-11 16:00:00");
    // 540 business minutes from Fri 16:00: 1h Fri + 8h Mon -> Mon 16:00
    expect(inSast(t.response_due_at)).toBe("2026-09-14 16:00");
  });

  it("a P0 raised Friday 16:00 stays on wall-clock minutes", async () => {
    const t = await makeTicket("critical", "2026-09-11 16:00:00");
    expect(inSast(t.response_due_at)).toBe("2026-09-11 16:05");
    expect(inSast(t.resolution_due_at)).toBe("2026-09-11 16:15");
  });

  it("a P1 raised Friday 16:00 stays on wall-clock minutes", async () => {
    const t = await makeTicket("high", "2026-09-11 16:00:00");
    expect(inSast(t.response_due_at)).toBe("2026-09-11 16:15");
    expect(inSast(t.resolution_due_at)).toBe("2026-09-11 17:00");
  });
});
