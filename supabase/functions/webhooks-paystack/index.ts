// POST /functions/v1/webhooks-paystack — Paystack calls this directly, no
// Supabase session involved (verify_jwt=false in config.toml). Truth-from-
// webhook per STITCHD-SRS-SDS.md §9.5: never trust client-reported success.
//
// One reference can only ever match one of boosts/orders/budget payments
// (all use next_ref with a distinct type prefix, ST-BST-/ST-BKG-/ST-BPY-),
// so try boosts first, then orders, then budget payments, falling through
// until one matches — that also makes an already-processed retry of any
// kind a safe no-op.
import { adminClient, jsonResponse } from "../_shared/clients.ts";
import { verifyWebhookSignature } from "../_shared/paystack.ts";
import { notify } from "../_shared/notify.ts";

async function activateBoost(reference: string): Promise<boolean> {
  const admin = adminClient();
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await admin
    .from("boosts")
    .update({ status: "active", starts_at: startsAt.toISOString(), expires_at: expiresAt.toISOString() })
    .eq("provider_ref", reference)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("failed to activate boost", error.message);
    throw new Error(error.message);
  }
  return !!data;
}

// FR-BOOK-02: a paid order spawns one lead per supplier (deduped — an order
// can carry several items from the same supplier). Mirrors leads-create's
// own insert shape and SMS-on-create behaviour exactly, so a lead spawned
// this way looks identical to one filed through the direct request form.
async function markOrderPaidAndSpawnLeads(reference: string): Promise<boolean> {
  const admin = adminClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("provider_ref", reference)
    .eq("status", "pending_payment")
    .select("id, ref, customer_name, customer_phone, customer_email")
    .maybeSingle();
  if (orderErr) {
    console.error("failed to mark order paid", orderErr.message);
    throw new Error(orderErr.message);
  }
  if (!order) return false;

  const { data: items, error: itemsErr } = await admin
    .from("order_items")
    .select("supplier_id, label, suppliers(name, phone, profile_id)")
    .eq("order_id", order.id);
  if (itemsErr) {
    console.error("failed to load order items for lead spawn", itemsErr.message);
    return true;
  }

  const bySupplier = new Map<string, { name: string; phone: string | null; profileId: string | null; labels: string[] }>();
  for (const it of (items ?? []) as unknown as { supplier_id: string; label: string; suppliers: { name: string; phone: string | null; profile_id: string | null } | null }[]) {
    const entry = bySupplier.get(it.supplier_id) ?? { name: it.suppliers?.name ?? "supplier", phone: it.suppliers?.phone ?? null, profileId: it.suppliers?.profile_id ?? null, labels: [] };
    entry.labels.push(it.label);
    bySupplier.set(it.supplier_id, entry);
  }

  for (const [supplierId, s] of bySupplier) {
    const { data: lead, error: leadErr } = await admin
      .from("leads")
      .insert({
        supplier_id: supplierId,
        order_id: order.id,
        requester_name: order.customer_name,
        requester_phone: order.customer_phone,
        requester_email: order.customer_email,
        details: `Paid booking ${order.ref} — ${s.labels.join(", ")}`,
      })
      .select("ref")
      .single();
    if (leadErr) {
      console.error(`failed to spawn lead for supplier ${supplierId} on order ${order.ref}`, leadErr.message);
      continue;
    }
    await notify(lead.ref, "lead_alert", { clientName: `${order.customer_name} (${order.customer_phone})`, ref: lead.ref }, s.phone, s.profileId ?? undefined);
  }

  return true;
}

// subscription.create fires once Paystack confirms the plan-based charge —
// separately from charge.success, which also fires for the same transaction
// but carries no subscription_code. Correlated by the customer's email
// (stored on the subscribers row's owning auth.users, matching the email
// stitched-plus-subscribe passed to Paystack at checkout) since Paystack's
// subscription payload carries no reference back to our own user_id.
async function activateSubscription(data: { subscription_code?: string; plan?: { plan_code?: string }; customer?: { email?: string; customer_code?: string } }): Promise<boolean> {
  const admin = adminClient();
  const email = data.customer?.email;
  if (!email || !data.subscription_code) return false;

  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.error("failed to list users for subscription activation", listErr.message);
    throw new Error(listErr.message);
  }
  const user = list.users.find((u) => u.email === email);
  if (!user) return false;

  const { data: updated, error } = await admin
    .from("subscribers")
    .update({
      status: "active",
      paystack_customer_code: data.customer?.customer_code ?? null,
      paystack_subscription_code: data.subscription_code,
      plan_code: data.plan?.plan_code ?? null,
      started_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("failed to activate subscriber", error.message);
    throw new Error(error.message);
  }
  return !!updated;
}

async function markBudgetPaymentPaid(reference: string): Promise<boolean> {
  const admin = adminClient();

  const { data, error } = await admin
    .from("budget_payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("provider_ref", reference)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("failed to mark budget payment paid", error.message);
    throw new Error(error.message);
  }
  return !!data;
}

// Every invocation gets exactly one row — success, failure, or a rejected
// signature — so Admin's Integration Health view has a real dead-letter/
// retry trail instead of console.error()s nobody can query.
async function recordDelivery(fields: {
  eventType: string | null;
  reference: string | null;
  status: "received" | "processed" | "failed" | "invalid_signature";
  errorMessage?: string;
  rawPayload: unknown;
}) {
  const admin = adminClient();
  const { error } = await admin.from("webhook_deliveries").insert({
    provider: "paystack",
    event_type: fields.eventType,
    reference: fields.reference,
    status: fields.status,
    error_message: fields.errorMessage ?? null,
    raw_payload: fields.rawPayload ?? {},
  });
  if (error) console.error("failed to record webhook_deliveries row", error.message);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const valid = await verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    await recordDelivery({ eventType: null, reference: null, status: "invalid_signature", errorMessage: "invalid signature", rawPayload: safeParse(rawBody) });
    return jsonResponse({ error: "invalid signature" }, 400);
  }

  const event = JSON.parse(rawBody);
  const reference: string | null = event.data?.reference ?? null;

  if (event.event === "charge.success") {
    try {
      const matchedBoost = await activateBoost(reference);
      const matchedOrder = matchedBoost ? false : await markOrderPaidAndSpawnLeads(reference);
      const matchedBudgetPayment = matchedBoost || matchedOrder ? false : await markBudgetPaymentPaid(reference);
      const note = !matchedBoost && !matchedOrder && !matchedBudgetPayment
        ? "no pending boost, order or budget payment matched — likely an already-processed retry"
        : undefined;
      if (note) console.log(`${note} (reference ${reference})`);
      await recordDelivery({ eventType: event.event, reference, status: "processed", errorMessage: note, rawPayload: event });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await recordDelivery({ eventType: event.event, reference, status: "failed", errorMessage: message, rawPayload: event });
      return jsonResponse({ error: message }, 500);
    }
  } else if (event.event === "subscription.create") {
    try {
      const matched = await activateSubscription(event.data);
      const note = matched ? undefined : "no subscriber matched this customer email";
      if (note) console.log(`${note} (reference ${reference})`);
      await recordDelivery({ eventType: event.event, reference, status: "processed", errorMessage: note, rawPayload: event });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await recordDelivery({ eventType: event.event, reference, status: "failed", errorMessage: message, rawPayload: event });
      return jsonResponse({ error: message }, 500);
    }
  } else {
    await recordDelivery({ eventType: event.event, reference, status: "received", rawPayload: event });
  }

  // Always 200 on a verified, recognised webhook so Paystack doesn't retry
  // indefinitely — even for event types we don't act on yet.
  return jsonResponse({ received: true });
});

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}
