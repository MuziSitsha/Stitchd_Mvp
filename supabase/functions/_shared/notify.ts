// Real send path for STITCHD-SRS-SDS.md §11's messaging module, wired to be
// visible instead of silent: every call renders a template and writes a
// message_log row (real send or not), so Admin's Message log card shows what
// went out — or would have, once real credentials exist. sendSms is already
// real (_shared/clickatell.ts, unchanged); sendWhatsApp follows the exact
// same "no-op + log when unconfigured" shape so flipping a WHATSAPP_TOKEN
// env var on later is the only change needed to make it real.
import { adminClient } from "./clients.ts";
import { sendSms } from "./clickatell.ts";

const TEMPLATES: Record<string, (vars: Record<string, string>) => string> = {
  lead_alert: (v) => `STITCHD: New request from ${v.clientName} for ${v.role ?? "your listing"}. Ref ${v.ref}. Log in to accept or decline.`,
  lead_accepted: (v) => `STITCHD: ${v.supplierName} accepted your request. Ref ${v.ref}. Check your Squad for next steps.`,
  quote_sent: (v) => `STITCHD: ${v.supplierName} sent a quote for ${v.ref} — ${v.total}. Review it in your Squad.`,
  quote_responded: (v) => `STITCHD: your quote for ${v.ref} was ${v.status} by the client. Check the Supplier Portal for details.`,
  dispute_update: (v) => `STITCHD: ticket ${v.ref} is now ${v.status}. Log in to review.`,
  lead_message: (v) => `STITCHD: ${v.supplierName} sent you a message about your request (${v.ref}). Reply here: ${v.link}`,
  supplier_approved: (v) => `STITCHD: your listing "${v.supplierName}" is approved and live — clients can now find and request you.`,
  supplier_declined: (v) => `STITCHD: your listing "${v.supplierName}" wasn't approved this time. Log in to your Supplier Portal for details.`,
  ticket_escalated: (v) => `STITCHD: ticket ${v.ref} breached its ${v.clock} clock (severity ${v.priority}) and has been escalated to level ${v.level}. Log in to review.`,
  rsvp_reminder: (v) => `STITCHD: RSVPs for ${v.function} close in ${v.days} ${v.days === "1" ? "day" : "days"} and ${v.outstanding} ${v.outstanding === "1" ? "household hasn't" : "households haven't"} replied yet. Chase them from your RSVP manager.`,
};

async function sendWhatsApp(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  if (!token) {
    console.log(`[whatsapp not configured] would send to ${to}: ${message}`);
    return { ok: false, error: "WHATSAPP_TOKEN not set" };
  }
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const resp = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: to.replace(/^\+/, ""), type: "text", text: { body: message } }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.error("whatsapp send failed", resp.status, text);
    return { ok: false, error: `whatsapp ${resp.status}: ${text}` };
  }
  return { ok: true };
}

// WhatsApp primary, SMS fallback per §11 — tries WhatsApp first, falls back
// to SMS only if that didn't go out, and logs exactly one row per
// notification (the channel that actually carried it, or "whatsapp" as the
// intended channel if neither could send). `to` may be null (no contact
// number on file) — still logs, so the audit trail shows the notification
// was due even when there was nowhere to send it.
// Return value added for notification_queue's processor (WBS-05) to make a
// real retry decision from — every existing call site uses `await
// notify(...)` with no destructuring, so this is purely additive, nothing
// upstream needed to change. "logged" means "nothing wrong, just nowhere to
// send it" (no contact number, or a provider genuinely unconfigured) —
// retrying won't fix either, so the queue treats it as suppressed, not
// failed.
export async function notify(
  ref: string,
  template: keyof typeof TEMPLATES,
  vars: Record<string, string>,
  to: string | null,
  toUserId?: string,
): Promise<{ status: "sent" | "logged" }> {
  const admin = adminClient();
  const message = TEMPLATES[template](vars);

  if (!to) {
    await admin.from("message_log").insert({
      ref, channel: "whatsapp", template, to_phone: null, to_user_id: toUserId ?? null,
      status: "logged", provider: "none", payload: { message, reason: "no contact number on file" },
    });
    return { status: "logged" };
  }

  const wa = await sendWhatsApp(to, message);
  if (wa.ok) {
    await admin.from("message_log").insert({
      ref, channel: "whatsapp", template, to_phone: to, to_user_id: toUserId ?? null,
      status: "sent", provider: "whatsapp_cloud", payload: { message },
    });
    return { status: "sent" };
  }

  const sms = await sendSms(to, message);
  await admin.from("message_log").insert({
    ref, channel: sms.ok ? "sms" : "whatsapp", template, to_phone: to, to_user_id: toUserId ?? null,
    status: sms.ok ? "sent" : "logged",
    provider: sms.ok ? "clickatell" : "whatsapp_cloud",
    payload: { message, whatsapp_error: wa.error, sms_error: sms.error },
  });
  return { status: sms.ok ? "sent" : "logged" };
}
