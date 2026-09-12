// POST /functions/v1/tickets-transition
//   { ticket_ref, to_status, reason?, owner_id? }
// Enforces the doc's Figure 10 state machine server-side — same "service
// role does the real check" idiom as supplier-tickets-confirm. The ticket's
// own claimed supplier, an admin/super, or (reopen only) the ticket's own
// client can move it; resolving or closing requires a resolution_summary
// (passed as `reason` for that call).
//
// category = 'task' (Merc's own testing feedback: personal to-dos need to
// be real, trackable tickets, not client-side state that vanishes) is a
// short client-driven exception to all of that: no supplier is involved,
// so the couple alone ticks it done and can un-tick it — see
// TASK_TRANSITIONS and the client-role gate below.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { notify } from "../_shared/notify.ts";

const TRANSITIONS: Record<string, string[]> = {
  open: ["assigned"],
  assigned: ["accepted"],
  accepted: ["in_progress"],
  in_progress: ["waiting_client", "waiting_supplier", "resolved"],
  waiting_client: ["in_progress"],
  waiting_supplier: ["in_progress"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["in_progress"],
};

const TASK_TRANSITIONS: Record<string, string[]> = {
  open: ["resolved"],
  resolved: ["open"],
  reopened: ["resolved"],
};

const TERMINAL_REQUIRING_SUMMARY = new Set(["resolved", "closed"]);

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
  const toStatus = body?.to_status as string | undefined;
  const reason = body?.reason as string | undefined;
  const requestedOwnerId = body?.owner_id as string | undefined;

  if (!ticketRef || !toStatus) {
    return jsonResponse({ error: "ticket_ref and to_status are required" }, 400);
  }

  const admin = adminClient();

  const { data: ticket, error: ticketErr } = await admin
    .from("tickets")
    .select("id, ref, status, category, supplier_id, event_id")
    .eq("ref", ticketRef)
    .maybeSingle();
  if (ticketErr) return jsonResponse({ error: ticketErr.message }, 500);
  if (!ticket) return jsonResponse({ error: "ticket not found" }, 404);

  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    p_user_id: userRes.user.id,
    p_roles: ["admin", "super"],
  });
  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);

  let actorRole: "admin" | "supplier" | "client" = "admin";
  if (!isAdmin) {
    // A pre-existing bug this fixture is what finally exercised: a
    // supplier-less ticket (every 'task', and any other category raised
    // without naming a supplier — 'venue', 'guest', 'platform_support',
    // 'dispute', 'other' can all be) has ticket.supplier_id === null, and
    // .eq("id", null) renders as the literal string "null" over PostgREST,
    // which Postgres then refuses to cast to uuid — a 500 on every client
    // trying to act on their own ticket, not just tasks. Skip the lookup
    // entirely when there's no supplier to match.
    let owningSupplier: { id: string } | null = null;
    if (ticket.supplier_id) {
      const { data, error: ownErr } = await admin
        .from("suppliers").select("id").eq("id", ticket.supplier_id).eq("profile_id", userRes.user.id).maybeSingle();
      if (ownErr) return jsonResponse({ error: ownErr.message }, 500);
      owningSupplier = data;
    }
    if (owningSupplier) {
      actorRole = "supplier";
    } else {
      const { data: owningEvent, error: eventErr } = await admin
        .from("events").select("id").eq("id", ticket.event_id).eq("owner_id", userRes.user.id).maybeSingle();
      if (eventErr) return jsonResponse({ error: eventErr.message }, 500);
      if (!owningEvent) return jsonResponse({ error: "must be the ticket's supplier, client, or an admin" }, 403);
      actorRole = "client";
    }
  }

  // A client can only ever reopen a support/dispute ticket — driving that
  // internal workflow forward (assign/accept/in-progress/resolve/close) is
  // supplier/admin's job. A 'task' ticket is the couple's own to-do, so
  // they drive its whole (short) lifecycle themselves.
  if (actorRole === "client" && ticket.category !== "task" && toStatus !== "reopened") {
    return jsonResponse({ error: "a client can only reopen a ticket" }, 403);
  }

  const legalNext = (ticket.category === "task" ? TASK_TRANSITIONS[ticket.status] : undefined) ?? TRANSITIONS[ticket.status] ?? [];
  if (!legalNext.includes(toStatus)) {
    return jsonResponse({ error: `cannot move a ${ticket.status} ticket to ${toStatus}` }, 400);
  }

  if (TERMINAL_REQUIRING_SUMMARY.has(toStatus) && !reason?.trim()) {
    return jsonResponse({ error: "a resolution summary is required to resolve or close a ticket" }, 400);
  }

  const updates: Record<string, unknown> = { status: toStatus, updated_at: new Date().toISOString() };
  if (toStatus === "assigned") updates.owner_id = requestedOwnerId ?? userRes.user.id;
  if (TERMINAL_REQUIRING_SUMMARY.has(toStatus)) updates.resolution_summary = reason;

  // .eq("status", ticket.status) guards the same fetch->update race the
  // rest of this codebase already guards against (e.g. supplier-tickets-
  // confirm) — if this matches zero rows, someone else moved it first.
  const { data: updated, error: updateErr } = await admin
    .from("tickets")
    .update(updates)
    .eq("id", ticket.id)
    .eq("status", ticket.status)
    .select("ref, status")
    .maybeSingle();
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);
  if (!updated) return jsonResponse({ error: "ticket was moved by someone else — refresh and retry" }, 409);

  const { error: transitionErr } = await admin.from("ticket_transitions").insert({
    ticket_id: ticket.id,
    from_status: ticket.status,
    to_status: toStatus,
    actor_id: userRes.user.id,
    actor_role: actorRole,
    reason: reason ?? null,
  });
  if (transitionErr) console.error("failed to record ticket_transitions row", transitionErr.message);

  if ((toStatus === "resolved" || toStatus === "closed") && ticket.category !== "task") {
    if (actorRole !== "client") {
      const { data: event } = await admin.from("events").select("owner_id").eq("id", ticket.event_id).maybeSingle();
      if (event) {
        const { data: profile } = await admin.from("profiles").select("phone").eq("id", event.owner_id).maybeSingle();
        await notify(updated.ref, "dispute_update", { status: toStatus, ref: updated.ref }, profile?.phone ?? null, event.owner_id);
      }
    }
    if (actorRole !== "supplier" && ticket.supplier_id) {
      const { data: supplier } = await admin.from("suppliers").select("phone, profile_id").eq("id", ticket.supplier_id).maybeSingle();
      if (supplier) {
        await notify(updated.ref, "dispute_update", { status: toStatus, ref: updated.ref }, supplier.phone, supplier.profile_id ?? undefined);
      }
    }
  }

  return jsonResponse(updated);
});
