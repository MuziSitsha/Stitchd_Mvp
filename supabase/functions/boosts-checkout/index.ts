// POST /functions/v1/boosts-checkout
// Requires the calling supplier's own JWT. Flat weekly Boost price per
// STITCHD-SRS-SDS.md's Boost = R350/wk. Real Paystack test-mode transaction —
// not simulated (docs/decisions.md: Boost must be genuinely real this week).
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { initializeTransaction } from "../_shared/paystack.ts";

const BOOST_PRICE_CENTS = 35000; // R350.00

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

  const admin = adminClient();
  const { data: supplier, error: supplierErr } = await admin
    .from("suppliers")
    .select("id, name")
    .eq("profile_id", userRes.user.id)
    .maybeSingle();
  if (supplierErr) return jsonResponse({ error: supplierErr.message }, 500);
  if (!supplier) return jsonResponse({ error: "no supplier profile linked to this account" }, 404);

  const { data: boost, error: boostErr } = await admin
    .from("boosts")
    .insert({ supplier_id: supplier.id, amount_cents: BOOST_PRICE_CENTS, status: "pending" })
    .select("id, ref")
    .single();
  if (boostErr) return jsonResponse({ error: boostErr.message }, 500);

  try {
    const checkout = await initializeTransaction({
      email: userRes.user.email ?? `${supplier.id}@stitchd.sandbox`,
      amountCents: BOOST_PRICE_CENTS,
      reference: boost.ref,
      metadata: { boost_id: boost.id, supplier_id: supplier.id },
    });

    await admin.from("boosts").update({ provider_ref: checkout.reference }).eq("id", boost.id);

    return jsonResponse({ ref: boost.ref, checkout_url: checkout.authorizationUrl });
  } catch (e) {
    await admin.from("boosts").update({ status: "failed" }).eq("id", boost.id);
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
});
