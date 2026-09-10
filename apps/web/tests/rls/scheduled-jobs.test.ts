import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// WBS-05/07 follow-up: the pg_cron jobs that make the reliability spine
// autonomous (ticket-escalation runs tickets_escalate() directly;
// drain-notification-queue calls the notifications-process Edge Function
// via pg_net). The jobs are paused for the test run by global-setup.ts.
// This file checks the glue is wired, not the downstream behaviour —
// ticket escalation is proven in ticket-clocks-rescue.test.ts and the
// queue drain in notification-queue.test.ts, both synchronously.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(SUPABASE_URL)) {
  throw new Error(`Refusing to run against a non-local Supabase URL (${SUPABASE_URL}).`);
}
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

afterAll(async () => {
  // Leave the jobs active — that's their state in every real deployment,
  // and global-setup's teardown does the same.
  await admin.rpc("set_scheduled_jobs_active", { p_active: true });
});

describe("scheduled jobs", () => {
  it("both cron jobs are registered (the pause function only succeeds if the rows are there)", async () => {
    const { error } = await admin.rpc("set_scheduled_jobs_active", { p_active: false });
    expect(error).toBeNull();
    await admin.rpc("set_scheduled_jobs_active", { p_active: true });
  });

  it("drain_notification_queue is service-role-callable and returns void without throwing", async () => {
    const { data, error } = await admin.rpc("drain_notification_queue");
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("tickets_escalate is service-role-callable and returns a (possibly empty) result set", async () => {
    const { data, error } = await admin.rpc("tickets_escalate");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
