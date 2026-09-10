import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Part K1: "5 failed attempts per 15 minutes per account" for login,
// enforced by GoTrue's password_verification_attempt hook
// (password_verification_attempt_hook -> public.auth_failed_logins).
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
const GOOD = "CorrectHorseBatteryStaple9!";

function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}
async function attempt(email: string, password: string) {
  const { error } = await anonClient().auth.signInWithPassword({ email, password });
  return error?.message ?? null; // null = signed in ok
}
const LOCKOUT = /too many failed sign-in attempts/i;

const users: { id: string; email: string }[] = [];
async function makeUser(tag: string) {
  const email = `rls-lockout-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: GOOD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  users.push({ id: data.user.id, email });
  return { id: data.user.id, email };
}
const clearFails = (userId: string) => admin.from("auth_failed_logins").delete().eq("user_id", userId);

afterAll(async () => {
  for (const u of users) {
    await admin.from("auth_failed_logins").delete().eq("user_id", u.id);
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.error(`could not delete fixture user ${u.id}:`, error.message);
  }
});

describe("account login lockout (Part K1)", () => {
  it("locks the account after 5 failed attempts — even the correct password is then refused", async () => {
    const u = await makeUser("main");
    for (let i = 1; i <= 5; i++) {
      const msg = await attempt(u.email, `wrong-${i}`);
      expect(msg, `attempt ${i}`).toBeTruthy(); // all fail
    }
    const locked = await attempt(u.email, GOOD);
    expect(locked).toMatch(LOCKOUT);

    // exactly 5 recorded — the 6th (this one) was rejected before it could add a row
    const { count } = await admin.from("auth_failed_logins").select("*", { count: "exact", head: true }).eq("user_id", u.id);
    expect(count).toBe(5);
  });

  it("four failures do not lock — the fifth attempt with the right password still works", async () => {
    const u = await makeUser("four");
    for (let i = 1; i <= 4; i++) expect(await attempt(u.email, `nope-${i}`)).toBeTruthy();
    const ok = await attempt(u.email, GOOD);
    expect(ok).toBeNull(); // signed in
    // a successful sign-in clears the counter
    const { count } = await admin.from("auth_failed_logins").select("*", { count: "exact", head: true }).eq("user_id", u.id);
    expect(count).toBe(0);
  });

  it("the lockout is per account — a second account is unaffected", async () => {
    const victim = await makeUser("victim");
    const bystander = await makeUser("bystander");
    for (let i = 1; i <= 5; i++) await attempt(victim.email, `x-${i}`);
    expect(await attempt(victim.email, GOOD)).toMatch(LOCKOUT);
    expect(await attempt(bystander.email, GOOD)).toBeNull(); // unaffected
    await clearFails(victim.id);
  });

  it("the window slides — once the failures age past 15 minutes the account unlocks", async () => {
    const u = await makeUser("window");
    for (let i = 1; i <= 5; i++) await attempt(u.email, `w-${i}`);
    expect(await attempt(u.email, GOOD)).toMatch(LOCKOUT);

    // simulate 16 minutes having passed
    await admin.from("auth_failed_logins")
      .update({ created_at: new Date(Date.now() - 16 * 60_000).toISOString() })
      .eq("user_id", u.id);

    expect(await attempt(u.email, GOOD)).toBeNull(); // unlocked, signs in
  });
});
