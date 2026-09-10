import { WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";

// globalSetup runs before setupFiles, so the WebSocket polyfill in
// tests/setup.ts isn't in scope yet — supabase-js's realtime client throws
// at construction under Node 20 without it.
if (!("WebSocket" in globalThis)) {
  (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;
}

// Runs once before the whole test run, once after. Pauses the pg_cron jobs
// (ticket-escalation, drain-notification-queue) for the duration — they run
// every minute against the same tickets/notification_queue rows the tests
// create and assert on, so without this a cron tick landing mid-test would
// flake escalation_level counts and steal queued rows out from under a
// claim assertion. The jobs stay active in every real deployment.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

export async function setup() {
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(SUPABASE_URL)) return;
  const { error } = await admin.rpc("set_scheduled_jobs_active", { p_active: false });
  // Older local DBs from before the scheduled-jobs migration won't have
  // this function — that's fine, there are no jobs to pause.
  if (error && !/could not find the function|does not exist/i.test(error.message)) {
    console.warn("global-setup: could not pause scheduled jobs:", error.message);
  }
}

export async function teardown() {
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(SUPABASE_URL)) return;
  const { error } = await admin.rpc("set_scheduled_jobs_active", { p_active: true });
  if (error) console.warn("global-setup teardown: could not resume scheduled jobs:", error.message);
}
