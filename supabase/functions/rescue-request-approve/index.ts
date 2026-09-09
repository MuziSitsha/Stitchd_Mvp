// POST /functions/v1/rescue-request-approve  { rescue_ref, decision: 'approved'|'declined' }
// Event owner or admin/super only — "The Owner or a valid delegate
// approves scope, payer and capped emergency spend before any replacement
// commitment." This records the decision; it never books anything itself,
// matching Part H2's "no automatic booking" rule literally.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "missing Authorization header" }, 401);
  const caller = callerClient(authHeader);
  const { data: userRes, error: userErr } = await caller.auth.getUser();
  if (userErr || !userRes.user) return jsonResponse({ error: "invalid session" }, 401);

  const body = await req.json().catch(() => ({}));
  const rescueRef = body?.rescue_ref as string | undefined;
  const decision = body?.decision as string | undefined;
  if (!rescueRef || !["approved", "declined"].includes(decision ?? "")) {
    return jsonResponse({ error: "rescue_ref and decision ('approved'|'declined') are required" }, 400);
  }

  const admin = adminClient();

  const { data: rescue, error: rescueErr } = await admin
    .from("rescue_requests")
    .select("id, decision, ticket_id, created_by, tickets(event_id, events(owner_id))")
    .eq("ref", rescueRef)
    .maybeSingle();
  if (rescueErr) return jsonResponse({ error: rescueErr.message }, 500);
  if (!rescue) return jsonResponse({ error: "rescue request not found" }, 404);
  if (rescue.decision !== "pending") return jsonResponse({ error: `already ${rescue.decision}` }, 400);

  const { data: isAdmin } = await admin.rpc("has_role", { p_user_id: userRes.user.id, p_roles: ["admin", "super"] });
  const ticket = rescue.tickets as unknown as { event_id: string; events: { owner_id: string } | null } | null;
  if (ticket?.events?.owner_id !== userRes.user.id && !isAdmin) {
    return jsonResponse({ error: "must be the event owner or an admin" }, 403);
  }
  // Real-money emergency spend gets the same "no self-approved decision"
  // discipline as refund ceiling/separation (WBS-06) — whoever proposed
  // this candidate cannot be the same person who signs off on it, even if
  // they hold both roles.
  if (rescue.created_by === userRes.user.id) {
    return jsonResponse({ error: "the person who proposed this candidate cannot also approve it" }, 403);
  }

  const { data: updated, error: updateErr } = await admin
    .from("rescue_requests")
    .update({ decision, approved_by: userRes.user.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", rescue.id)
    .eq("decision", "pending")
    .select("ref, decision")
    .maybeSingle();
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);
  if (!updated) return jsonResponse({ error: "this request was already decided by someone else" }, 409);

  return jsonResponse(updated);
});
