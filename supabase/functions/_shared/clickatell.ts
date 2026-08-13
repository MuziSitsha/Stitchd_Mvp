// Thin Clickatell SMS wrapper. No-ops (logs + returns ok:false) when
// CLICKATELL_API_KEY isn't configured yet, so callers never need to branch
// on whether SMS is wired up — lead creation etc. still succeeds either way.
export async function sendSms(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get("CLICKATELL_API_KEY");
  if (!apiKey) {
    console.log(`[sms not configured] would send to ${to}: ${message}`);
    return { ok: false, error: "CLICKATELL_API_KEY not set" };
  }

  const resp = await fetch("https://platform.clickatell.com/messages", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: message, to: [to.replace(/^\+/, "")] }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("clickatell send failed", resp.status, text);
    return { ok: false, error: `clickatell ${resp.status}: ${text}` };
  }

  return { ok: true };
}
