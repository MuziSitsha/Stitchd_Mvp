// GET /functions/v1/tickets-trace/:ref  ->  STITCHD-SRS-SDS.md §13.3
// "GET /api/v1/tickets/:ref/trace" — full audit trail for any ref.
// RLS-scoped: queries as the caller (their JWT is forwarded), not as admin,
// so a client only ever sees the trace rows they're allowed to see per the
// permission matrix (§B3.5). Chain-expansion across related refs (booking ->
// leads -> payments) lands once those entities exist from Phase 3 onward —
// for now a ref's own activity_log rows are the whole trace.
import { callerClient, jsonResponse } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const ref = decodeURIComponent(parts[parts.length - 1] ?? "");

  if (!ref || !ref.startsWith("ST-")) {
    return jsonResponse({ error: "invalid ref, expected ST-<TYPE>-#####" }, 400);
  }

  const supabase = callerClient(req.headers.get("Authorization"));

  const { data, error } = await supabase
    .from("activity_log")
    .select("ref, entity_type, entity_id, actor_id, actor_role, from_state, to_state, event, payload, at")
    .eq("ref", ref)
    .order("at", { ascending: true });

  if (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  if (!data || data.length === 0) {
    return jsonResponse({ error: "not found, or not visible to this caller" }, 404);
  }

  return jsonResponse({ ref, trace: data });
});
