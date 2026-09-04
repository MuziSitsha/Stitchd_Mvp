// POST /functions/v1/lead-messages { ref, token?, body? }
// One shape for both listing and sending, matching this codebase's
// POST-only callFunction convention (apps/web/src/lib/functions.ts) — omit
// `body` to just list the thread (used for polling), include it to send.
//   { ref, token }              — anonymous customer (token = leads.access_token)
//   { ref } + Authorization JWT — supplier or admin
//
// Stitch It leads are frequently anonymous checkouts — no account to log
// back into — so unlike ticket_messages (Phase 1, RLS scoped to auth.uid()),
// lead_messages has zero client-facing RLS policies at all. This function is
// the only door in: the service role does the real authorization check
// (token match for the customer, ownership/role check for the supplier or
// admin), same "service role does the real check" idiom as
// supplier-tickets-confirm. Admin can read (Phase 7 oversight) but not post.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { notify } from "../_shared/notify.ts";

interface LeadRow {
  id: string;
  ref: string;
  access_token: string;
  requester_phone: string;
  suppliers: { name: string; profile_id: string | null } | null;
}

type Auth = { role: "customer" | "supplier" | "admin"; userId: string | null };

async function authorize(
  req: Request,
  admin: ReturnType<typeof adminClient>,
  lead: LeadRow,
  token: string | undefined,
): Promise<Auth | null> {
  if (token) {
    return token === lead.access_token ? { role: "customer", userId: null } : null;
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const caller = callerClient(authHeader);
  const { data: userRes } = await caller.auth.getUser();
  if (!userRes.user) return null;

  const { data: isAdmin } = await admin.rpc("has_role", {
    p_user_id: userRes.user.id,
    p_roles: ["admin", "super"],
  });
  if (isAdmin) return { role: "admin", userId: userRes.user.id };

  if (lead.suppliers?.profile_id && lead.suppliers.profile_id === userRes.user.id) {
    return { role: "supplier", userId: userRes.user.id };
  }
  return null;
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const admin = adminClient();
  const json = await req.json().catch(() => ({}));
  const ref: string | undefined = json?.ref;
  const token: string | undefined = json?.token;
  const messageBody: string | undefined = json?.body;

  if (!ref) return jsonResponse({ error: "ref is required" }, 400);

  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .select("id, ref, access_token, requester_phone, suppliers(name, profile_id)")
    .eq("ref", ref)
    .maybeSingle();
  if (leadErr) return jsonResponse({ error: leadErr.message }, 500);
  if (!lead) return jsonResponse({ error: "lead not found" }, 404);

  const auth = await authorize(req, admin, lead as unknown as LeadRow, token);
  if (!auth) return jsonResponse({ error: "not authorized for this lead" }, 403);

  if (messageBody !== undefined) {
    if (!messageBody.trim()) return jsonResponse({ error: "body is required" }, 400);
    if (auth.role === "admin") return jsonResponse({ error: "admin has read-only access to lead threads" }, 403);

    const senderRole = auth.role;
    const { error: insertErr } = await admin.from("lead_messages").insert({
      lead_id: lead.id,
      sender_role: senderRole,
      sender_id: auth.userId,
      body: messageBody.trim(),
    });
    if (insertErr) return jsonResponse({ error: insertErr.message }, 500);

    // First supplier message on this lead — text the customer their magic
    // link, since they have no account to come back and check on their own.
    if (senderRole === "supplier") {
      const { count } = await admin
        .from("lead_messages")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id)
        .eq("sender_role", "supplier");
      if (count === 1) {
        const site = Deno.env.get("SITE_URL") ?? "https://stitchd-mvp.vercel.app";
        const link = `${site}/thread/${lead.ref}?token=${lead.access_token}`;
        const supplierName = (lead as unknown as LeadRow).suppliers?.name ?? "A supplier";
        await notify(lead.ref, "lead_message", { supplierName, ref: lead.ref, link }, lead.requester_phone);
      }
    }
  }

  const { data: messages, error: msgErr } = await admin
    .from("lead_messages")
    .select("id, sender_role, body, created_at")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });
  if (msgErr) return jsonResponse({ error: msgErr.message }, 500);

  return jsonResponse({
    messages,
    lead: { ref: lead.ref, supplier_name: (lead as unknown as LeadRow).suppliers?.name ?? null },
    viewer_role: auth.role,
  });
});
