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
