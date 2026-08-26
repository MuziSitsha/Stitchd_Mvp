// POST /functions/v1/budget-payment-checkout  { label, amount_cents }
// Requires the calling client's own JWT. Same shape as boosts-checkout /
// orders-checkout (init a real Paystack transaction, store the provider
// ref, let the webhook be the only source of truth for payment success) —
// see 20260825120000_budget_payments.sql for why this captures label/amount
// as a snapshot rather than referencing a budget-item row that doesn't
// exist in the database yet.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { initializeTransaction } from "../_shared/paystack.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "missing Authorization header" }, 401);

  const caller = callerClient(authHeader);
  const { data: userRes, error: userErr } = await caller.auth.getUser();
  if (userErr || !userRes.user) return jsonResponse({ error: "invalid session" }, 401);

  const body = await req.json().catch(() => ({}));
  const label = body?.label as string | undefined;
  const amountCents = body?.amount_cents as number | undefined;
  if (!label) return jsonResponse({ error: "label is required" }, 400);
  if (!amountCents || amountCents <= 0) return jsonResponse({ error: "amount_cents must be a positive number" }, 400);

  const { data: event, error: eventErr } = await caller
    .from("events").select("id").eq("owner_id", userRes.user.id).maybeSingle();
  if (eventErr) return jsonResponse({ error: eventErr.message }, 500);
  if (!event) return jsonResponse({ error: "no event found for this account" }, 404);

  const admin = adminClient();
  const { data: payment, error: insertErr } = await admin
    .from("budget_payments")
    .insert({ event_id: event.id, label, amount_cents: amountCents })
    .select("id, ref")
    .single();
  if (insertErr) return jsonResponse({ error: insertErr.message }, 500);

  try {
    const checkout = await initializeTransaction({
      email: userRes.user.email ?? `${event.id}@stitchd.sandbox`,
      amountCents,
      reference: payment.ref,
      metadata: { budget_payment_id: payment.id, event_id: event.id, label },
    });

    await admin.from("budget_payments").update({ provider_ref: checkout.reference }).eq("id", payment.id);

    return jsonResponse({ ref: payment.ref, checkout_url: checkout.authorizationUrl });
  } catch (e) {
    await admin.from("budget_payments").update({ status: "failed" }).eq("id", payment.id);
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
});
