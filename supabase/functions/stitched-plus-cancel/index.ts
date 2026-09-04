// POST /functions/v1/stitched-plus-cancel — caller's own subscription only.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { disableSubscription } from "../_shared/paystack.ts";

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

  const { data: sub, error: subErr } = await admin
    .from("subscribers").select("id, status, paystack_subscription_code").eq("user_id", userRes.user.id).maybeSingle();
  if (subErr) return jsonResponse({ error: subErr.message }, 500);
  if (!sub || sub.status !== "active") return jsonResponse({ error: "no active Stitched+ subscription to cancel" }, 400);
  if (!sub.paystack_subscription_code) return jsonResponse({ error: "subscription not yet confirmed by the webhook — try again shortly" }, 409);

  try {
    await disableSubscription(sub.paystack_subscription_code);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 502);
  }

  const { error: updateErr } = await admin
    .from("subscribers")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", sub.id);
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

  return jsonResponse({ status: "cancelled" });
});
