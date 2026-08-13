import { supabase } from "./supabase";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1`;

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
