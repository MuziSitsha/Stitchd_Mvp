// POST /functions/v1/quotes-respond
//   { quote_ref, decision: 'accept'|'decline'|'request_changes', note? }
// Client-only — ownership-checked against the ticket's event.owner_id, same
// idiom as leads-respond. Accepting sets the quote accepted AND confirms
// the underlying supplier_ticket (reusing its existing confirmed_by/
// confirmed_role/confirmed_at columns, now recorded as confirmed_role
// 'client' — see the migration note on why that value had to be added).
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
  const quoteRef = body?.quote_ref as string | undefined;
  const decision = body?.decision as string | undefined;
  const note = body?.note as string | undefined;

  if (!quoteRef || !["accept", "decline", "request_changes"].includes(decision ?? "")) {
    return jsonResponse({ error: "quote_ref and decision ('accept'|'decline'|'request_changes') are required" }, 400);
  }

  const admin = adminClient();

  const { data: quote, error: quoteErr } = await admin
    .from("quotes")
    .select("id, status, ticket_id, current_version, supplier_tickets(id, event_id, status, supplier_id, suppliers(phone, profile_id))")
    .eq("ref", quoteRef)
    .maybeSingle();
  if (quoteErr) return jsonResponse({ error: quoteErr.message }, 500);
  if (!quote) return jsonResponse({ error: "quote not found" }, 404);
  if (quote.status !== "sent") return jsonResponse({ error: `cannot respond to a quote that is ${quote.status}` }, 400);

  const ticket = quote.supplier_tickets as unknown as { id: string; event_id: string; status: string; supplier_id: string; suppliers: { phone: string | null; profile_id: string | null } | null } | null;
  if (!ticket) return jsonResponse({ error: "quote's ticket not found" }, 500);

  const { data: owning, error: ownErr } = await admin
    .from("events").select("id").eq("id", ticket.event_id).eq("owner_id", userRes.user.id).maybeSingle();
  if (ownErr) return jsonResponse({ error: ownErr.message }, 500);
  if (!owning) return jsonResponse({ error: "must be the owner of this ticket's event" }, 403);

  const newStatus = decision === "accept" ? "accepted" : decision === "decline" ? "declined" : "change_requested";

  const { data: updatedQuote, error: updateErr } = await admin
    .from("quotes")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", quote.id)
    .eq("status", "sent")
    .select("ref, status")
    .maybeSingle();
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);
  if (!updatedQuote) return jsonResponse({ error: "quote was updated by someone else — refresh and retry" }, 409);

  if (decision === "accept") {
    if (ticket.status === "pending") {
      const { error: confirmErr } = await admin
        .from("supplier_tickets")
        .update({ status: "confirmed", confirmed_by: userRes.user.id, confirmed_role: "client", confirmed_at: new Date().toISOString() })
        .eq("id", ticket.id)
        .eq("status", "pending");
      if (confirmErr) return jsonResponse({ error: confirmErr.message }, 500);
    }

    // Part J1: "exactly one booking per accepted quote version" — this is
    // that row, not just the quotes.status flip. quote.current_version was
    // read in the same query as the "must currently be sent" check above,
    // so this is exactly the version that was just locked as accepted, not
    // a value that could have moved between read and write.
    const { data: versionRow } = await admin
      .from("quote_versions")
      .select("id")
      .eq("quote_id", quote.id)
      .eq("version", quote.current_version)
      .maybeSingle();
    if (versionRow) {
      const { error: bookingErr } = await admin
        .from("bookings")
        .insert({ quote_version_id: versionRow.id, state: "confirmed", confirmed_at: new Date().toISOString() });
      // bookings_one_per_quote_version makes a retried accept a harmless
      // conflict, not a real failure — the row we wanted already exists.
      if (bookingErr && !bookingErr.message.includes("bookings_one_per_quote_version")) {
        console.error("failed to create booking row", bookingErr.message);
      }
    }
  }

  if (decision === "request_changes" && note?.trim()) {
    // Recorded as a plain ticket_messages entry so the change-request note
    // shows up in the same thread the two parties already use — no new
    // "quote notes" surface needed.
    const { error: noteErr } = await admin.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: userRes.user.id,
      sender_role: "client",
      body: `Requested changes to ${quoteRef}: ${note.trim()}`,
    });
    if (noteErr) console.error("failed to record change-request note", noteErr.message);
  }

  await notify(
    updatedQuote.ref, "quote_responded",
    { status: newStatus.replace("_", " "), ref: updatedQuote.ref },
    ticket.suppliers?.phone ?? null, ticket.suppliers?.profile_id ?? undefined,
  );

  return jsonResponse(updatedQuote);
});
