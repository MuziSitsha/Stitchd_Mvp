// POST /functions/v1/rescue-request-create
//   { ticket_id, candidate_supplier_id?, candidate_name?,
//     availability_confirmed_at?, contact_evidence?, cost_cents?,
//     capped_spend_cents? }
// Event owner or admin/super. Records a Rescue candidate — proposing one,
// never committing to one. "There is no automatic booking, no unfunded
// float and no replacement guarantee" (Part H2): this endpoint only ever
// creates a 'pending' row; rescue-request-approve is the separate,
// explicit step that requires a human decision before anything is acted on.
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
  const ticketId = body?.ticket_id as string | undefined;
  if (!ticketId) return jsonResponse({ error: "ticket_id is required" }, 400);

  const admin = adminClient();

  const { data: ticket, error: ticketErr } = await admin
    .from("tickets")
    .select("id, event_id, ref, events(owner_id)")
    .eq("id", ticketId)
    .maybeSingle();
  if (ticketErr) return jsonResponse({ error: ticketErr.message }, 500);
  if (!ticket) return jsonResponse({ error: "ticket not found" }, 404);

  const { data: isAdmin } = await admin.rpc("has_role", { p_user_id: userRes.user.id, p_roles: ["admin", "super"] });
  const owner = ticket.events as unknown as { owner_id: string } | null;
  if (owner?.owner_id !== userRes.user.id && !isAdmin) {
    return jsonResponse({ error: "must be the event owner or an admin" }, 403);
  }

  const { data: created, error: insertErr } = await admin
    .from("rescue_requests")
    .insert({
      ticket_id: ticketId,
      candidate_supplier_id: body?.candidate_supplier_id ?? null,
      candidate_name: body?.candidate_name ?? null,
      availability_confirmed_at: body?.availability_confirmed_at ?? null,
      contact_evidence: body?.contact_evidence ?? null,
      cost_cents: body?.cost_cents ?? null,
      capped_spend_cents: body?.capped_spend_cents ?? null,
      created_by: userRes.user.id,
    })
    .select("ref, decision")
    .single();
  if (insertErr) return jsonResponse({ error: insertErr.message }, 500);

  return jsonResponse(created);
});
