import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// WBS-06 (Part K1 / T-PAY-04): "Partial, duplicate, self-approved refund
// -> Ceiling and separation enforced." Paystack itself isn't credentialed
// locally (a deliberate, standing decision for this whole project) — these
// tests prove every check that happens BEFORE a real Paystack call
// (ceiling, over-total rejection, self-approval rejection, double-decision
// rejection, decline-never-touches-Paystack), and confirm the one path
// that does reach Paystack fails gracefully and honestly rather than
// silently, matching this project's "demo honestly" pattern everywhere
// else uncredentialed providers show up.
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
const PASSWORD = "RefundCeilingTest1234!";
const stamp = Date.now();

async function makeAdmin(tag: string) {
  const email = `rls-refund-${tag}-${stamp}@stitchd.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`could not create ${tag}: ${error?.message}`);
  await admin.from("role_assignments").insert({ user_id: data.user.id, role: "admin", status: "active" });
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

let adminA: { id: string; client: SupabaseClient };
let adminB: { id: string; client: SupabaseClient };
const userIds: string[] = [];
const orderIds: string[] = [];

beforeAll(async () => {
  adminA = await makeAdmin("a");
  adminB = await makeAdmin("b");
  userIds.push(adminA.id, adminB.id);
});

afterAll(async () => {
  await admin.from("refunds").delete().in("order_id", orderIds);
  await admin.from("large_refund_approvals").delete().in("order_id", orderIds);
  await admin.from("orders").delete().in("id", orderIds);
  for (const id of userIds) await admin.from("role_assignments").delete().eq("user_id", id);
  for (const id of userIds) await admin.from("message_log").delete().eq("to_user_id", id);
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`could not delete fixture user ${id}:`, error.message);
  }
});

async function makePaidOrder(totalCents: number) {
  const { data } = await admin
    .from("orders")
    .insert({ customer_name: "Test Customer", customer_phone: "+27821234567", subtotal_cents: totalCents, total_cents: totalCents, status: "paid", provider_ref: `test-ref-${stamp}-${Math.random().toString(36).slice(2)}` })
    .select("id, ref, total_cents")
    .single();
  orderIds.push(data!.id);
  return data!;
}

describe("payments-refund — ceiling enforced before any Paystack call", () => {
  it("a refund within the ceiling and within the order total is accepted up to the point of the (uncredentialed) Paystack call", async () => {
    const order = await makePaidOrder(500000); // R5,000 — under the R10,000 ceiling
    const { status } = await call("payments-refund", await jwtFor(adminA), { order_ref: order.ref, reason: "test", amount_cents: 100000 });
    // No real Paystack credentials locally (deliberate) — the call reaches
    // refundTransaction and fails there, honestly, rather than silently
    // pretending to succeed. What matters here is it got PAST the ceiling
    // and total checks, not that Paystack itself is reachable.
    expect(status).toBe(502);
    const { data: failedRow } = await admin.from("refunds").select("status").eq("order_id", order.id).maybeSingle();
    expect(failedRow?.status).toBe("failed"); // recorded honestly, not swallowed
  });

  it("a refund exceeding the order's own total is rejected outright, regardless of ceiling", async () => {
    const order = await makePaidOrder(50000); // R500
    const { status, json } = await call("payments-refund", await jwtFor(adminA), { order_ref: order.ref, reason: "test", amount_cents: 100000 });
    expect(status).toBe(400);
    expect(json.error).toMatch(/cannot refund/);
  });

  it("a refund over the ceiling is rejected with a pointer to the large-refund flow, never reaching Paystack", async () => {
    const order = await makePaidOrder(2000000); // R20,000
    const { status, json } = await call("payments-refund", await jwtFor(adminA), { order_ref: order.ref, reason: "test", amount_cents: 1500000 });
    expect(status).toBe(400);
    expect(json.requires_large_refund_approval).toBe(true);
    const { data: noRow } = await admin.from("refunds").select("id").eq("order_id", order.id);
    expect(noRow).toEqual([]); // nothing recorded at all — rejected before any attempt
  });
});

describe("refund-request-large + refund-approve-large — real separation", () => {
  it("rejects amounts that don't actually need the large-refund flow", async () => {
    const order = await makePaidOrder(500000);
    const { status } = await call("refund-request-large", await jwtFor(adminA), { order_ref: order.ref, reason: "test", amount_cents: 500000 });
    expect(status).toBe(400);
  });

  it("admin A can request; admin A cannot also approve their own request", async () => {
    const order = await makePaidOrder(2000000);
    const { status: reqStatus, json: created } = await call("refund-request-large", await jwtFor(adminA), { order_ref: order.ref, reason: "large legitimate refund", amount_cents: 1500000 });
    expect(reqStatus).toBe(200);
    expect(created.status).toBe("pending");

    const selfApprove = await call("refund-approve-large", await jwtFor(adminA), { request_ref: created.ref, decision: "approved" });
    expect(selfApprove.status).toBe(403);
    expect(selfApprove.json.error).toMatch(/cannot also approve/);
  });

  it("a second, different admin approving reaches the (uncredentialed) Paystack call honestly", async () => {
    const order = await makePaidOrder(2000000);
    const { json: created } = await call("refund-request-large", await jwtFor(adminA), { order_ref: order.ref, reason: "large legitimate refund", amount_cents: 1500000 });

    const approve = await call("refund-approve-large", await jwtFor(adminB), { request_ref: created.ref, decision: "approved" });
    expect(approve.status).toBe(502); // same honest Paystack-unconfigured failure as the direct path

    // The approval itself is still correctly recorded as claimed/approved
    // (separation happened) even though the money movement then failed.
    const { data: approvalRow } = await admin.from("large_refund_approvals").select("status, approved_by").eq("ref", created.ref).single();
    expect(approvalRow?.status).toBe("approved");
    expect(approvalRow?.approved_by).toBe(adminB.id);
  });

  it("a decline never touches Paystack at all and needs no second-admin distinction beyond the decision itself", async () => {
    const order = await makePaidOrder(2000000);
    const { json: created } = await call("refund-request-large", await jwtFor(adminA), { order_ref: order.ref, reason: "will be declined", amount_cents: 1500000 });
    const decline = await call("refund-approve-large", await jwtFor(adminB), { request_ref: created.ref, decision: "declined" });
    expect(decline.status).toBe(200);
    expect(decline.json.status).toBe("declined");
    const { data: refundRow } = await admin.from("refunds").select("id").eq("order_id", order.id);
    expect(refundRow).toEqual([]); // nothing moved
  });

  it("a decision, once made, cannot be made again", async () => {
    const order = await makePaidOrder(2000000);
    const { json: created } = await call("refund-request-large", await jwtFor(adminA), { order_ref: order.ref, reason: "double decision test", amount_cents: 1500000 });
    const first = await call("refund-approve-large", await jwtFor(adminB), { request_ref: created.ref, decision: "declined" });
    expect(first.status).toBe(200);
    const second = await call("refund-approve-large", await jwtFor(adminB), { request_ref: created.ref, decision: "approved" });
    expect(second.status).toBe(400);
  });

  it("only one pending large-refund request is allowed per order at a time", async () => {
    const order = await makePaidOrder(2000000);
    const first = await call("refund-request-large", await jwtFor(adminA), { order_ref: order.ref, reason: "first", amount_cents: 1500000 });
    expect(first.status).toBe(200);
    const second = await call("refund-request-large", await jwtFor(adminB), { order_ref: order.ref, reason: "second", amount_cents: 1200000 });
    expect(second.status).toBe(409);
  });
});
