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
