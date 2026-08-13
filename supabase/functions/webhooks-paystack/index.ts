// POST /functions/v1/webhooks-paystack — Paystack calls this directly, no
// Supabase session involved (verify_jwt=false in config.toml). Truth-from-
// webhook per STITCHD-SRS-SDS.md §9.5: never trust client-reported success.
//
// One reference can only ever match one of boosts/orders (both use
// next_ref with a distinct type prefix, ST-BST-/ST-BKG-), so try boosts
// first and only fall through to orders if nothing matched — that also
// makes an already-processed retry of either kind a safe no-op.
import { adminClient, jsonResponse } from "../_shared/clients.ts";
import { verifyWebhookSignature } from "../_shared/paystack.ts";
import { sendSms } from "../_shared/clickatell.ts";

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
    .select("supplier_id, label, suppliers(name, phone)")
    .eq("order_id", order.id);
  if (itemsErr) {
    console.error("failed to load order items for lead spawn", itemsErr.message);
    return true;
  }

  const bySupplier = new Map<string, { name: string; phone: string | null; labels: string[] }>();
  for (const it of (items ?? []) as unknown as { supplier_id: string; label: string; suppliers: { name: string; phone: string | null } | null }[]) {
    const entry = bySupplier.get(it.supplier_id) ?? { name: it.suppliers?.name ?? "supplier", phone: it.suppliers?.phone ?? null, labels: [] };
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
    if (s.phone) {
      await sendSms(s.phone, `STITCHD: New paid booking from ${order.customer_name} (${order.customer_phone}). Ref ${lead.ref}. Log in to accept or decline.`);
    }
  }

  return true;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const valid = await verifyWebhookSignature(rawBody, signature);
  if (!valid) {
    return jsonResponse({ error: "invalid signature" }, 400);
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    try {
      const matchedBoost = await activateBoost(reference);
      const matchedOrder = matchedBoost ? false : await markOrderPaidAndSpawnLeads(reference);
      if (!matchedBoost && !matchedOrder) {
        console.log(`no pending boost or order matched reference ${reference} — likely an already-processed retry`);
      }
    } catch (e) {
      return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 500);
    }
  }

  // Always 200 on a verified, recognised webhook so Paystack doesn't retry
  // indefinitely — even for event types we don't act on yet.
  return jsonResponse({ received: true });
});
