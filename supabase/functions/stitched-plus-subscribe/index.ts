// POST /functions/v1/stitched-plus-subscribe
// Requires the caller's own JWT. Real Paystack test-mode subscription — same
// "genuinely real this week" bar boosts-checkout was held to
// (docs/decisions.md) — not a client-side discount toggle. R99/mo per
// data.ts's SUB constant, the same figure the Stitch It UI already quotes.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { ensurePlan, initializeTransaction } from "../_shared/paystack.ts";

const SUB_PRICE_CENTS = 9900; // R99.00/mo — data.ts SUB.price

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

  const { data: existing, error: findErr } = await admin
    .from("subscribers").select("status").eq("user_id", userRes.user.id).maybeSingle();
  if (findErr) return jsonResponse({ error: findErr.message }, 500);
  if (existing?.status === "active") return jsonResponse({ error: "already an active Stitched+ member" }, 400);

  try {
    const planCode = await ensurePlan({ name: "Stitched+ Monthly", amountCents: SUB_PRICE_CENTS, interval: "monthly" });

    const ref = `ST-SUB-${userRes.user.id.slice(0, 8)}-${Date.now()}`;
    const checkout = await initializeTransaction({
      email: userRes.user.email ?? `${userRes.user.id}@stitchd.sandbox`,
      amountCents: SUB_PRICE_CENTS,
      reference: ref,
      plan: planCode,
      metadata: { user_id: userRes.user.id, purpose: "stitched_plus" },
    });

    await admin.from("subscribers").upsert(
      { user_id: userRes.user.id, status: "pending", plan_code: planCode },
      { onConflict: "user_id" },
    );

    return jsonResponse({ ref, checkout_url: checkout.authorizationUrl });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
});
