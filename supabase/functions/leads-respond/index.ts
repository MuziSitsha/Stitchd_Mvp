// POST /functions/v1/leads-respond  { lead_ref, action: "accept"|"decline" }
// Requires the calling supplier's own JWT — runs through their session (not
// the service role), so RLS's leads_update_own_supplier policy is the actual
// enforcement: an unrelated supplier's update just matches zero rows.
import { callerClient, jsonResponse } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "missing Authorization header" }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const { lead_ref, action } = body ?? {};
  if (!lead_ref || !["accept", "decline"].includes(action)) {
    return jsonResponse({ error: "lead_ref and action ('accept'|'decline') are required" }, 400);
  }

  const supabase = callerClient(authHeader);
  const status = action === "accept" ? "accepted" : "declined";

  const { data, error } = await supabase
    .from("leads")
    .update({ status })
    .eq("ref", lead_ref)
    .eq("status", "new")
    .select("ref, status")
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 400);
  if (!data) {
    return jsonResponse({ error: "lead not found, not yours, or already responded to" }, 404);
  }

  return jsonResponse(data);
});
