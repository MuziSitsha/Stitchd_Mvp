// Minimal Paystack adapter — test-mode this week (STITCHD-SRS-SDS.md §9.2's
// PaymentProvider shape, narrowed to just what Boost checkout needs).

const PAYSTACK_BASE = "https://api.paystack.co";

function secretKey(): string {
  const key = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!key) throw new Error("PAYSTACK_SECRET_KEY not configured");
  return key;
}

export async function initializeTransaction(input: {
  email: string;
  amountCents: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  plan?: string;
}): Promise<{ authorizationUrl: string; accessCode: string; reference: string }> {
  const resp = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountCents,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      plan: input.plan,
    }),
  });

  const json = await resp.json();
  if (!resp.ok || !json.status) {
    throw new Error(`Paystack initialize failed: ${json.message ?? resp.statusText}`);
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

// Idempotent — Paystack has no "create if missing" primitive, so list first
// (plans are cheap to list, this project has exactly one) and only create on
// a genuine first run. Safe to call on every subscribe attempt.
export async function ensurePlan(input: { name: string; amountCents: number; interval: "monthly" }): Promise<string> {
  const listResp = await fetch(`${PAYSTACK_BASE}/plan?name=${encodeURIComponent(input.name)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const listJson = await listResp.json();
  const existing = (listJson.data ?? []).find((p: { name: string; plan_code: string }) => p.name === input.name);
  if (existing) return existing.plan_code;

  const createResp = await fetch(`${PAYSTACK_BASE}/plan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: input.name, amount: input.amountCents, interval: input.interval }),
  });
  const createJson = await createResp.json();
  if (!createResp.ok || !createJson.status) {
    throw new Error(`Paystack plan create failed: ${createJson.message ?? createResp.statusText}`);
  }
  return createJson.data.plan_code;
}

// Paystack's /subscription/disable needs the subscription's own email_token,
// not just its code — fetch it first (GET /subscription/:code) so the caller
// only ever needs to know the subscription_code they already stored.
export async function disableSubscription(subscriptionCode: string): Promise<void> {
  const getResp = await fetch(`${PAYSTACK_BASE}/subscription/${subscriptionCode}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const getJson = await getResp.json();
  if (!getResp.ok || !getJson.status) {
    throw new Error(`Paystack subscription lookup failed: ${getJson.message ?? getResp.statusText}`);
  }
  const emailToken = getJson.data.email_token;

  const disableResp = await fetch(`${PAYSTACK_BASE}/subscription/disable`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
  });
  const disableJson = await disableResp.json();
  if (!disableResp.ok || !disableJson.status) {
    throw new Error(`Paystack subscription disable failed: ${disableJson.message ?? disableResp.statusText}`);
  }
}

export async function refundTransaction(reference: string, amountCents?: number): Promise<{ status: string; refundId: number }> {
  const resp = await fetch(`${PAYSTACK_BASE}/refund`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: reference, amount: amountCents }),
  });
  const json = await resp.json();
  if (!resp.ok || !json.status) {
    throw new Error(`Paystack refund failed: ${json.message ?? resp.statusText}`);
  }
  return { status: json.data.status, refundId: json.data.id };
}

export async function verifyWebhookSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey()),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}
