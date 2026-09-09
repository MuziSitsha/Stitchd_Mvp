// POST /functions/v1/tickets-escalate
// Admin/super only. Thin wrapper around tickets_escalate() — a scheduled
// pg_cron+pg_net trigger is the natural next step for this (matching
// notifications-process's own noted gap), not attempted in this pass.
// Callable on demand from Admin Console meanwhile.
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

  const admin = adminClient();
  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", { p_user_id: userRes.user.id, p_roles: ["admin", "super"] });
  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);
  if (!isAdmin) return jsonResponse({ error: "admin or super role required" }, 403);

  const { data: escalated, error } = await admin.rpc("tickets_escalate");
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ escalated_count: escalated?.length ?? 0, escalated });
});
