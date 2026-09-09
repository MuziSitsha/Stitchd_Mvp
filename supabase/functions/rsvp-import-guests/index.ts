// POST /functions/v1/rsvp-import-guests
//   { event_id, fingerprint, households: [{ label, guests: [{ display_name,
//     person_type?, function_ids: string[] }] }] }
// Host-only. "Import is idempotent by upload fingerprint plus explicit row
// key" (Part F1) — a retried identical submit (double-click, two tabs) is
// detected against guest_import_batches and the prior result is returned
// rather than silently duplicating every household and guest.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

const MAX_GUESTS_PER_EVENT = 1000;
const MAX_GUESTS_PER_HOUSEHOLD = 20;

interface GuestInput {
  display_name: string;
  person_type?: "adult" | "child";
  function_ids: string[];
}
interface HouseholdInput {
  label: string;
  guests: GuestInput[];
}

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
  const eventId = body?.event_id as string | undefined;
  const fingerprint = body?.fingerprint as string | undefined;
  const households = body?.households as HouseholdInput[] | undefined;

  if (!eventId || !fingerprint || !Array.isArray(households) || households.length === 0) {
    return jsonResponse({ error: "event_id, fingerprint, and a non-empty households array are required" }, 400);
  }
  for (const h of households) {
    if (!h.label?.trim()) return jsonResponse({ error: "every household needs a label" }, 400);
    if (!Array.isArray(h.guests) || h.guests.length === 0) return jsonResponse({ error: `household "${h.label}" has no guests` }, 400);
    if (h.guests.length > MAX_GUESTS_PER_HOUSEHOLD) {
      return jsonResponse({ error: `household "${h.label}" has ${h.guests.length} guests — the limit is ${MAX_GUESTS_PER_HOUSEHOLD} per household` }, 422);
    }
    for (const g of h.guests) {
      if (!g.display_name?.trim()) return jsonResponse({ error: `every guest in "${h.label}" needs a name` }, 400);
      if (!Array.isArray(g.function_ids) || g.function_ids.length === 0) {
        return jsonResponse({ error: `guest "${g.display_name}" has no function entitlements — invited to nothing` }, 400);
      }
    }
  }

  const admin = adminClient();

  const { data: owning, error: ownErr } = await admin.from("events").select("id").eq("id", eventId).eq("owner_id", userRes.user.id).maybeSingle();
  if (ownErr) return jsonResponse({ error: ownErr.message }, 500);
  if (!owning) return jsonResponse({ error: "must be the owner of this event" }, 403);

  const { data: existingBatch, error: batchLookupErr } = await admin
    .from("guest_import_batches")
    .select("id, household_count, guest_count")
    .eq("event_id", eventId)
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  if (batchLookupErr) return jsonResponse({ error: batchLookupErr.message }, 500);
  if (existingBatch) {
    return jsonResponse({ imported: false, already_imported: true, household_count: existingBatch.household_count, guest_count: existingBatch.guest_count });
  }

  const { count: existingGuestCount, error: countErr } = await admin
    .from("guests")
    .select("id, households!inner(event_id)", { count: "exact", head: true })
    .eq("households.event_id", eventId);
  if (countErr) return jsonResponse({ error: countErr.message }, 500);
  const incomingGuestCount = households.reduce((sum, h) => sum + h.guests.length, 0);
  if ((existingGuestCount ?? 0) + incomingGuestCount > MAX_GUESTS_PER_EVENT) {
    return jsonResponse({ error: `this import would bring the event to ${(existingGuestCount ?? 0) + incomingGuestCount} guests — the limit is ${MAX_GUESTS_PER_EVENT}` }, 422);
  }

  // Function IDs must actually belong to this event — a forged or
  // cross-event function_id is a data-integrity bug waiting to happen, not
  // just a UI concern, so it's checked here rather than trusted from the
  // client.
  const allFunctionIds = [...new Set(households.flatMap((h) => h.guests.flatMap((g) => g.function_ids)))];
  const { data: validFunctions, error: fnErr } = await admin.from("functions").select("id").eq("event_id", eventId).in("id", allFunctionIds);
  if (fnErr) return jsonResponse({ error: fnErr.message }, 500);
  const validFunctionIds = new Set((validFunctions ?? []).map((f) => f.id));
  const invalidFunctionId = allFunctionIds.find((id) => !validFunctionIds.has(id));
  if (invalidFunctionId) return jsonResponse({ error: `function_id ${invalidFunctionId} does not belong to this event` }, 422);

  let householdCount = 0;
  let guestCount = 0;

  for (const h of households) {
    const { data: householdRow, error: hErr } = await admin.from("households").insert({ event_id: eventId, label: h.label.trim() }).select("id").single();
    if (hErr || !householdRow) return jsonResponse({ error: hErr?.message ?? "household creation failed" }, 500);
    householdCount += 1;

    for (const g of h.guests) {
      const { data: guestRow, error: gErr } = await admin
        .from("guests")
        .insert({ household_id: householdRow.id, display_name: g.display_name.trim(), person_type: g.person_type ?? "adult" })
        .select("id")
        .single();
      if (gErr || !guestRow) return jsonResponse({ error: gErr?.message ?? "guest creation failed" }, 500);
      guestCount += 1;

      const { error: entErr } = await admin
        .from("guest_entitlements")
        .insert(g.function_ids.map((fid) => ({ guest_id: guestRow.id, function_id: fid })));
      if (entErr) return jsonResponse({ error: entErr.message }, 500);

      const { error: respErr } = await admin
        .from("guest_responses")
        .insert(g.function_ids.map((fid) => ({ guest_id: guestRow.id, function_id: fid, state: "not_responded" })));
      if (respErr) return jsonResponse({ error: respErr.message }, 500);
    }
  }

  const { error: batchErr } = await admin
    .from("guest_import_batches")
    .insert({ event_id: eventId, fingerprint, household_count: householdCount, guest_count: guestCount });
  if (batchErr) console.error("failed to record import batch (import itself succeeded)", batchErr.message);

  return jsonResponse({ imported: true, already_imported: false, household_count: householdCount, guest_count: guestCount });
});
