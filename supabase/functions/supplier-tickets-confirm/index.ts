// POST /functions/v1/supplier-tickets-confirm
//   { "ticket_ref": string, "decision"?: "confirm" | "decline" }
// Dual-actor: either the claimed supplier for the ticket's listing
// (suppliers.profile_id = caller) or an admin/super can respond. Doesn't fit
// either existing single-actor Edge Function template alone, so this
// recombines both: an explicit has_role() RPC check plus an ownership
// check, same primitives leads-reroute/leads-respond each use separately.
// `decision` defaults to "confirm" for backward compatibility with existing
// callers that only ever confirmed; "decline" is the couple's "needs
// attention" path — same confirmed_by/confirmed_role/confirmed_at columns
// record who responded and when either way.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { notify } from "../_shared/notify.ts";

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
  const ticketRef = body?.ticket_ref as string | undefined;
  if (!ticketRef) return jsonResponse({ error: "ticket_ref is required" }, 400);
  const decision = (body?.decision as string | undefined) ?? "confirm";
  if (decision !== "confirm" && decision !== "decline") {
    return jsonResponse({ error: "decision must be 'confirm' or 'decline'" }, 400);
  }
  const newStatus = decision === "confirm" ? "confirmed" : "declined";

  const admin = adminClient();

  const { data: ticket, error: ticketErr } = await admin
    .from("supplier_tickets")
    .select("id, ref, status, supplier_id, event_id, suppliers(name)")
    .eq("ref", ticketRef).eq("status", "pending")
    .maybeSingle();
  if (ticketErr) return jsonResponse({ error: ticketErr.message }, 500);
  if (!ticket) return jsonResponse({ error: "ticket not found or already responded to" }, 404);

  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    p_user_id: userRes.user.id,
    p_roles: ["admin", "super"],
  });
  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);

  let confirmedRole: "supplier" | "admin" = "supplier";
  if (isAdmin) {
    confirmedRole = "admin";
  } else {
    const { data: owning, error: ownErr } = await admin
      .from("suppliers").select("id").eq("id", ticket.supplier_id).eq("profile_id", userRes.user.id).maybeSingle();
    if (ownErr) return jsonResponse({ error: ownErr.message }, 500);
    if (!owning) return jsonResponse({ error: "must be the claimed supplier or an admin to confirm this ticket" }, 403);
  }

  // .eq("status","pending") guards the fetch->update race: if this matches
  // zero rows, someone else already responded in between.
  const { data: updated, error: updateErr } = await admin
    .from("supplier_tickets")
    .update({ status: newStatus, confirmed_by: userRes.user.id, confirmed_role: confirmedRole, confirmed_at: new Date().toISOString() })
    .eq("id", ticket.id).eq("status", "pending")
    .select("ref, status, confirmed_at, confirmed_role")
    .maybeSingle();
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);
  if (!updated) return jsonResponse({ error: "already responded to by someone else" }, 409);

  if (newStatus === "confirmed") {
    const { data: event } = await admin.from("events").select("owner_id").eq("id", ticket.event_id).maybeSingle();
    if (event) {
      const { data: profile } = await admin.from("profiles").select("phone").eq("id", event.owner_id).maybeSingle();
      const supplierName = (ticket.suppliers as unknown as { name: string } | null)?.name ?? "your supplier";
      await notify(updated.ref, "lead_accepted", { supplierName, ref: updated.ref }, profile?.phone ?? null, event.owner_id);
    }
  }

  return jsonResponse(updated);
});
