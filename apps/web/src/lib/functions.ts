import { supabase } from "./supabase";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1`;

// orders-checkout / boosts-checkout both throw the Paystack SDK's own error
// message verbatim (see supabase/functions/_shared/paystack.ts) — genuinely
// useful in server logs, but "PAYSTACK_SECRET_KEY not configured" reads like
// a leaked internal detail if a real user (or a demo audience) sees it raised
// as-is in the UI. This is the one translation point both checkout call
// sites funnel through.
export function friendlyPaymentError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/paystack_secret_key/i.test(msg)) return "Card payments aren't switched on in this environment yet — use “Print quote” to send it instead.";
  return msg || "Checkout failed";
}

async function callFunction<T>(name: string, options: { body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (options.auth) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("not signed in");
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  const resp = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json.error ?? `${name} failed (${resp.status})`);
  }
  return json as T;
}

export function respondToLead(leadRef: string, action: "accept" | "decline") {
  return callFunction<{ ref: string; status: string }>("leads-respond", {
    auth: true,
    body: { lead_ref: leadRef, action },
  });
}

export function startBoostCheckout() {
  return callFunction<{ ref: string; checkout_url: string }>("boosts-checkout", { auth: true });
}

export function subscribeStitchedPlus() {
  return callFunction<{ ref: string; checkout_url: string }>("stitched-plus-subscribe", { auth: true });
}

export function cancelStitchedPlus() {
  return callFunction<{ status: string }>("stitched-plus-cancel", { auth: true });
}

export function refundOrder(orderRef: string, reason: string) {
  return callFunction<{ ref: string; order_ref: string; status: string }>("payments-refund", {
    auth: true,
    body: { order_ref: orderRef, reason },
  });
}

export function createLead(input: {
  supplier_id: string;
  requester_name: string;
  requester_phone: string;
  requester_email?: string;
  details?: string;
}) {
  return callFunction<{ ref: string; supplier: string }>("leads-create", { body: input });
}

export function priceBasket(input: { items: { supplier_id: string; qty: number; addon_cents?: number }[]; subscriber?: boolean }) {
  return callFunction<{
    items: { supplier_id: string; name: string; qty: number; unit_price_cents: number; addon_cents: number; line_total_cents: number }[];
    subtotal_cents: number;
    bundle_saving_cents: number;
    member_saving_cents: number;
    delivery_cents: number;
    total_cents: number;
  }>("baskets-price", { body: input });
}

export function createOrder(input: {
  items: { supplier_id: string; qty: number; addon_cents?: number }[];
  subscriber?: boolean;
  occasion?: string;
  hire_date?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
}) {
  return callFunction<{ ref: string; total_cents: number }>("orders-create", { body: input });
}

export function checkoutOrder(ref: string) {
  return callFunction<{ ref: string; checkout_url: string }>("orders-checkout", { body: { ref } });
}

export function rerouteLead(leadRef: string, supplierId: string) {
  return callFunction<{ ref: string; supplier: string }>("leads-reroute", {
    auth: true,
    body: { lead_ref: leadRef, supplier_id: supplierId },
  });
}

export function adminToggleBoost(supplierId: string) {
  return callFunction<{ featured: boolean }>("boosts-admin-toggle", {
    auth: true,
    body: { supplier_id: supplierId },
  });
}

export function adminSuspendSupplier(supplierId: string, suspend: boolean) {
  return callFunction<{ status: string }>("suppliers-admin-suspend", {
    auth: true,
    body: { supplier_id: supplierId, suspend },
  });
}

export function adminReviewSupplier(supplierId: string, decision: "approve" | "decline") {
  return callFunction<{ status: string }>("suppliers-admin-review", {
    auth: true,
    body: { supplier_id: supplierId, decision },
  });
}

export type TicketStatusV2 =
  | "open" | "assigned" | "accepted" | "in_progress"
  | "waiting_client" | "waiting_supplier" | "resolved" | "closed" | "reopened";

export function transitionTicket(ticketRef: string, toStatus: TicketStatusV2, reason?: string, ownerId?: string) {
  return callFunction<{ ref: string; status: string }>("tickets-transition", {
    auth: true,
    body: { ticket_ref: ticketRef, to_status: toStatus, reason, owner_id: ownerId },
  });
}

export interface QuoteItemInput {
  label: string;
  qty: number;
  unit_price_cents: number;
}

export function createQuote(ticketRef: string, items: QuoteItemInput[], note?: string) {
  return callFunction<{ ref: string; status: string; current_version: number }>("quotes-create", {
    auth: true,
    body: { ticket_ref: ticketRef, items, note },
  });
}

export function respondToQuote(quoteRef: string, decision: "accept" | "decline" | "request_changes", note?: string) {
  return callFunction<{ ref: string; status: string }>("quotes-respond", {
    auth: true,
    body: { quote_ref: quoteRef, decision, note },
  });
}

export function unpublishPromotion(promotionRef: string) {
  return callFunction<{ ref: string; status: string }>("promotions-admin-moderate", {
    auth: true,
    body: { promotion_ref: promotionRef, action: "unpublish" },
  });
}

export function createSupplierTicket(supplierName: string) {
  return callFunction<{ ref: string; status: string; created_at: string }>("supplier-tickets-create", {
    auth: true,
    body: { supplier_name: supplierName },
  });
}

export function confirmSupplierTicket(ticketRef: string) {
  return callFunction<{ ref: string; status: string; confirmed_at: string; confirmed_role: string }>("supplier-tickets-confirm", {
    auth: true,
    body: { ticket_ref: ticketRef },
  });
}

export function respondToSupplierTicket(ticketRef: string, decision: "confirm" | "decline") {
  return callFunction<{ ref: string; status: string; confirmed_at: string; confirmed_role: string }>("supplier-tickets-confirm", {
    auth: true,
    body: { ticket_ref: ticketRef, decision },
  });
}

export function checkoutBudgetPayment(label: string, amountCents: number) {
  return callFunction<{ ref: string; checkout_url: string }>("budget-payment-checkout", {
    auth: true,
    body: { label, amount_cents: amountCents },
  });
}

export interface LeadThreadMessage {
  id: string;
  sender_role: "customer" | "supplier";
  body: string;
  created_at: string;
}
export interface LeadThreadResponse {
  messages: LeadThreadMessage[];
  lead: { ref: string; supplier_name: string | null };
  viewer_role: "customer" | "supplier" | "admin";
}

// Anonymous customer path (token, no session) omits `auth`; the supplier
// portal and admin's read-only Conversations oversight instead call this
// with `token` undefined and rely on their own session, so pass
// `withSession` to opt into that Authorization header.
export function fetchLeadThread(ref: string, opts: { token?: string; withSession?: boolean } = {}) {
  return callFunction<LeadThreadResponse>("lead-messages", {
    auth: !!opts.withSession,
    body: { ref, token: opts.token },
  });
}

export function sendLeadMessage(ref: string, body: string, opts: { token?: string; withSession?: boolean } = {}) {
  return callFunction<LeadThreadResponse>("lead-messages", {
    auth: !!opts.withSession,
    body: { ref, token: opts.token, body },
  });
}

// RSVP — host side (real Supabase session, event owner only).
export interface RsvpImportResult {
  imported: boolean;
  already_imported: boolean;
  household_count: number;
  guest_count: number;
}
export function importRsvpGuests(
  eventId: string,
  fingerprint: string,
  households: { label: string; guests: { display_name: string; person_type?: "adult" | "child"; function_ids: string[] }[] }[],
) {
  return callFunction<RsvpImportResult>("rsvp-import-guests", {
    auth: true,
    body: { event_id: eventId, fingerprint, households },
  });
}
export function publishRsvpInvitation(householdId: string) {
  return callFunction<{ token: string; expires_at: string }>("rsvp-publish-invitation", {
    auth: true,
    body: { household_id: householdId },
  });
}

// RSVP — guest side. No Supabase session at all (see rsvp-exchange-token's
// own header comment) — token/session_token are the only credential, same
// shape as the Stitch It lead-thread functions above.
export interface RsvpGuestEntitlement {
  function_id: string;
  plus_one_allowed: boolean;
  functions: { id: string; name: string; starts_at: string | null; location: string | null } | null;
}
export interface RsvpGuestResponseRow {
  function_id: string;
  state: "not_responded" | "draft" | "submitted";
  answer: "attending" | "declined" | null;
  meal: string | null;
  dietary_note: string | null;
  plus_one_name: string | null;
  revision: number;
}
export interface RsvpGuestRow {
  id: string;
  display_name: string;
  person_type: "adult" | "child";
  guest_entitlements: RsvpGuestEntitlement[];
  guest_responses: RsvpGuestResponseRow[];
}
export interface RsvpExchangeResult {
  session_token: string;
  session_expires_at: string;
  household: { id: string; label: string };
  guests: RsvpGuestRow[];
}
export function exchangeRsvpToken(token: string) {
  return callFunction<RsvpExchangeResult>("rsvp-exchange-token", { body: { token } });
}

export interface RsvpSubmitInput {
  guest_id: string;
  function_id: string;
  answer?: "attending" | "declined";
  draft?: boolean;
  meal?: string | null;
  dietary_note?: string | null;
  plus_one_name?: string | null;
  expected_revision: number;
}
export interface RsvpSubmitResult {
  results: Array<{ guest_id: string; function_id: string; state?: string; revision?: number; conflict?: boolean }>;
  counts: Record<string, number>;
}
export function submitRsvpResponses(sessionToken: string, responses: RsvpSubmitInput[]) {
  return callFunction<RsvpSubmitResult>("rsvp-submit-response", {
    body: { session_token: sessionToken, responses },
  });
}
