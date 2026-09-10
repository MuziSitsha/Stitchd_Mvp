import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Part C1 / M3: "The server enforces the launch flag, so a direct API call
// cannot bypass the closed gate." This proves that literally — a raw
// supabase.auth.signUp() against GoTrue, not just a disabled button.
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
const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const stamp = Date.now();
const createdUserIds: string[] = [];

async function setSignupOpen(open: boolean) {
  await admin.from("platform_settings").update({ signup_open: open, updated_at: new Date().toISOString() }).eq("id", 1);
}

let plainUser: { id: string; client: SupabaseClient };
let adminUser: { id: string; client: SupabaseClient };

beforeAll(async () => {
  for (const [tag, role] of [["plain", null], ["admin", "admin"]] as const) {
    const email = `rls-flag-${tag}-${stamp}@stitchd.test`;
    const { data } = await admin.auth.admin.createUser({ email, password: "FlagTest1234!", email_confirm: true });
    createdUserIds.push(data!.user!.id);
    if (role) await admin.from("role_assignments").insert({ user_id: data!.user!.id, role, status: "active" });
    const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    await client.auth.signInWithPassword({ email, password: "FlagTest1234!" });
    if (tag === "plain") plainUser = { id: data!.user!.id, client };
    else adminUser = { id: data!.user!.id, client };
  }
});

afterAll(async () => {
  await setSignupOpen(false); // spec default — leave it closed
  for (const id of createdUserIds) await admin.from("role_assignments").delete().eq("user_id", id);
  for (const id of createdUserIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

describe("platform_settings — RLS", () => {
  it("anyone can read it (the landing page needs it, unauthenticated)", async () => {
    const { data, error } = await anon.from("platform_settings").select("signup_open").eq("id", 1).single();
    expect(error).toBeNull();
    expect(typeof data?.signup_open).toBe("boolean");
  });

  it("a plain authenticated user cannot flip the flag", async () => {
    await plainUser.client.from("platform_settings").update({ signup_open: true }).eq("id", 1);
    const { data } = await admin.from("platform_settings").select("signup_open").eq("id", 1).single();
    expect(data?.signup_open).toBe(false); // untouched
  });

  it("an admin can flip the flag", async () => {
    const { error } = await adminUser.client.from("platform_settings").update({ signup_open: true }).eq("id", 1);
    expect(error).toBeNull();
    const { data } = await admin.from("platform_settings").select("signup_open").eq("id", 1).single();
    expect(data?.signup_open).toBe(true);
    await setSignupOpen(false);
  });
});

describe("before_user_created hook — server-enforced gate", () => {
  it("a raw public signup is rejected while signup_open is false", async () => {
    await setSignupOpen(false);
    const { data, error } = await anon.auth.signUp({ email: `rls-flag-pubsignup-a-${stamp}@stitchd.test`, password: "FlagTest1234!" });
    expect(data.user).toBeNull();
    expect(error?.message).toMatch(/not open yet/i);
  });

  it("the same public signup succeeds once an admin opens the gate", async () => {
    await setSignupOpen(true);
    const { data, error } = await anon.auth.signUp({ email: `rls-flag-pubsignup-b-${stamp}@stitchd.test`, password: "FlagTest1234!" });
    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    if (data.user) createdUserIds.push(data.user.id);
    await setSignupOpen(false);
  });

  it("staff-provisioned account creation is never gated, regardless of the flag", async () => {
    await setSignupOpen(false);
    const { data, error } = await admin.auth.admin.createUser({ email: `rls-flag-provisioned-${stamp}@stitchd.test`, password: "FlagTest1234!", email_confirm: true });
    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    if (data.user) createdUserIds.push(data.user.id);
  });
});
