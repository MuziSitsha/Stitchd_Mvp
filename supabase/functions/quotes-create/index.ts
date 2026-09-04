// POST /functions/v1/quotes-create
//   { ticket_ref, items: [{ label, qty, unit_price_cents }], note? }
// Supplier-only — sends the first version of a quote, or a revision after
// the client requested changes. Same ownership-check idiom as
// supplier-tickets-create; versions are immutable once created (a revision
// is always a new quote_versions row, never an edit).
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { notify } from "../_shared/notify.ts";

interface ItemInput {
  label: string;
  qty: number;
  unit_price_cents: number;
}

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
  const items = body?.items as ItemInput[] | undefined;
  const note = body?.note as string | undefined;

  if (!ticketRef || !Array.isArray(items) || items.length === 0) {
    return jsonResponse({ error: "ticket_ref and at least one item are required" }, 400);
  }
  for (const it of items) {
    if (!it.label || !Number.isFinite(it.qty) || it.qty <= 0 || !Number.isFinite(it.unit_price_cents) || it.unit_price_cents < 0) {
      return jsonResponse({ error: "each item needs a label, positive qty and non-negative unit_price_cents" }, 400);
    }
  }

  const admin = adminClient();

  const { data: ticket, error: ticketErr } = await admin
    .from("supplier_tickets")
    .select("id, status, supplier_id, event_id, suppliers(name)")
    .eq("ref", ticketRef)
    .maybeSingle();
  if (ticketErr) return jsonResponse({ error: ticketErr.message }, 500);
  if (!ticket) return jsonResponse({ error: "ticket not found" }, 404);
  if (ticket.status !== "pending") return jsonResponse({ error: "can only quote a pending ticket" }, 400);

  const { data: owning, error: ownErr } = await admin
    .from("suppliers").select("id").eq("id", ticket.supplier_id).eq("profile_id", userRes.user.id).maybeSingle();
  if (ownErr) return jsonResponse({ error: ownErr.message }, 500);
  if (!owning) return jsonResponse({ error: "must be the claimed supplier for this ticket" }, 403);

  const { data: existing, error: findErr } = await admin
    .from("quotes")
    .select("id, status, current_version")
    .eq("ticket_id", ticket.id)
    .maybeSingle();
  if (findErr) return jsonResponse({ error: findErr.message }, 500);

  // A supplier can revise their own still-open quote (catch a pricing typo,
  // add a line) without waiting for the client to formally request changes —
  // "sent" and "change_requested" are both still-negotiating states. Once
  // the client has accepted or declined, the quote is locked.
  if (existing && !["sent", "change_requested"].includes(existing.status)) {
    return jsonResponse({ error: `cannot send a new version while the quote is ${existing.status}` }, 400);
  }

  let quoteId = existing?.id;
  if (!quoteId) {
    const { data: created, error: createErr } = await admin
      .from("quotes")
      .insert({ ticket_id: ticket.id })
      .select("id")
      .single();
    if (createErr) return jsonResponse({ error: createErr.message }, 500);
    quoteId = created.id;
  }

  const version = (existing?.current_version ?? 0) + 1;
  const totalCents = items.reduce((sum, it) => sum + it.qty * it.unit_price_cents, 0);

  const { data: versionRow, error: versionErr } = await admin
    .from("quote_versions")
    .insert({ quote_id: quoteId, version, total_cents: totalCents, note: note ?? null, created_by: userRes.user.id })
    .select("id")
    .single();
  if (versionErr) return jsonResponse({ error: versionErr.message }, 500);

  const { error: itemsErr } = await admin.from("quote_items").insert(
    items.map((it) => ({
      quote_version_id: versionRow.id,
      label: it.label,
      qty: it.qty,
      unit_price_cents: it.unit_price_cents,
      line_total_cents: it.qty * it.unit_price_cents,
    })),
  );
  if (itemsErr) return jsonResponse({ error: itemsErr.message }, 500);

  const { data: updatedQuote, error: updateErr } = await admin
    .from("quotes")
    .update({ status: "sent", current_version: version, updated_at: new Date().toISOString() })
    .eq("id", quoteId)
    .select("ref, status, current_version")
    .single();
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

  // log_activity() (attached to `quotes`) only captures the parent row's own
  // status flip — it has no view into quote_versions/quote_items, which have
  // no `ref` of their own to key a generic trigger off anyway. Insert one
  // explicit row here, keyed to the quote's real ref, so tracing that ref
  // through the Transaction Inspector shows the actual negotiated amounts
  // for every version, not just "a new version was sent."
  const { error: logErr } = await admin.from("activity_log").insert({
    ref: updatedQuote.ref,
    entity_type: "quote_versions",
    entity_id: versionRow.id,
    actor_id: userRes.user.id,
    actor_role: "supplier",
    from_state: existing ? `v${existing.current_version}` : null,
    to_state: `v${version}`,
    event: "quote_versions.created",
    payload: { version, total_cents: totalCents, note: note ?? null, items },
  });
  if (logErr) console.error("failed to log quote_versions activity", logErr.message);

  const { data: event } = await admin.from("events").select("owner_id").eq("id", ticket.event_id).maybeSingle();
  if (event) {
    const { data: profile } = await admin.from("profiles").select("phone").eq("id", event.owner_id).maybeSingle();
    const supplierName = (ticket.suppliers as unknown as { name: string } | null)?.name ?? "Your supplier";
    await notify(
      updatedQuote.ref, "quote_sent",
      { supplierName, ref: updatedQuote.ref, total: `R${Math.round(totalCents / 100).toLocaleString("en-ZA")}` },
      profile?.phone ?? null, event.owner_id,
    );
  }

  return jsonResponse(updatedQuote);
});
