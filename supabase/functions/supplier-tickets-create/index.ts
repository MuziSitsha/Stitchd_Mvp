// POST /functions/v1/supplier-tickets-create  { "supplier_name": string }
// Client-initiated: requests confirmation on a supplier for the caller's own
// wedding. Idempotent — repeat clicks while a ticket is already pending just
// return the existing row (matches auth-test-token's own
// select-then-write idiom for the same class of uniqueness gotcha).
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
  const supplierName = body?.supplier_name as string | undefined;
  if (!supplierName) return jsonResponse({ error: "supplier_name is required" }, 400);

  const { data: event, error: eventErr } = await caller
    .from("events").select("id").eq("owner_id", userRes.user.id).maybeSingle();
  if (eventErr) return jsonResponse({ error: eventErr.message }, 500);
  if (!event) return jsonResponse({ error: "no event found for this account" }, 404);

  const { data: supplier, error: supplierErr } = await caller
    .from("suppliers").select("id, category, phone, profile_id").eq("name", supplierName).maybeSingle();
  if (supplierErr) return jsonResponse({ error: supplierErr.message }, 500);
  if (!supplier) return jsonResponse({ error: "supplier not found" }, 404);

  const admin = adminClient();

  const { data: existing, error: findErr } = await admin
    .from("supplier_tickets")
    .select("ref, status, created_at")
    .eq("event_id", event.id).eq("supplier_id", supplier.id).eq("status", "pending")
    .maybeSingle();
  if (findErr) return jsonResponse({ error: findErr.message }, 500);
  if (existing) return jsonResponse(existing);

  const { data: ticket, error: insertErr } = await admin
    .from("supplier_tickets")
    .insert({ event_id: event.id, supplier_id: supplier.id, requested_by: userRes.user.id })
    .select("ref, status, created_at")
    .single();

  if (insertErr) {
    // Lost a race to a concurrent duplicate click — return the winning row
    // instead of an error, since the user only ever took one action.
    if (insertErr.code === "23505") {
      const { data: raced } = await admin
        .from("supplier_tickets").select("ref, status, created_at")
        .eq("event_id", event.id).eq("supplier_id", supplier.id).eq("status", "pending")
        .maybeSingle();
      if (raced) return jsonResponse(raced);
    }
    return jsonResponse({ error: insertErr.message }, 500);
  }

  const { data: profile } = await admin.from("profiles").select("display_name").eq("id", userRes.user.id).maybeSingle();
  await notify(
    ticket.ref, "lead_alert",
    { clientName: profile?.display_name ?? "A couple", role: supplier.category, ref: ticket.ref },
    supplier.phone, supplier.profile_id ?? undefined,
  );

  return jsonResponse(ticket);
});
