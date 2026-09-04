import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { fetchLeadThread, sendLeadMessage, type LeadThreadMessage } from "../../lib/functions";

// Sibling to TicketThread.tsx, same bubble styling, but polling instead of
// Postgres Realtime — lead_messages has zero client-facing RLS (an anonymous
// customer has no session to scope a subscription to), so every read/write
// goes through the lead-messages Edge Function instead of the table directly.
export function LeadThreadPanel({
  T, leadRef, token, withSession,
}: {
  T: Theme;
  leadRef: string;
  token?: string;
  withSession?: boolean;
}) {
  const [messages, setMessages] = useState<LeadThreadMessage[]>([]);
  const [viewerRole, setViewerRole] = useState<"customer" | "supplier" | "admin" | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchLeadThread(leadRef, { token, withSession });
      setMessages(res.messages);
      setViewerRole(res.viewer_role);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    }
  }, [leadRef, token, withSession]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send() {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await sendLeadMessage(leadRef, text, { token, withSession });
      setMessages(res.messages);
      setViewerRole(res.viewer_role);
      setBody("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const btnA = { background: T.accent, color: T.onAccent };

  return (
    <div className="flex flex-col">
      {error && <div className="mb-2 text-xs font-semibold" style={{ color: T.bad }}>{error}</div>}
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No messages yet — say hello.</div>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_role === viewerRole ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] rounded-2xl px-3 py-2 text-xs"
              style={
                m.sender_role === viewerRole
                  ? { background: T.accent, color: T.onAccent, borderBottomRightRadius: 6 }
                  : { background: T.panel2, color: T.ink, borderBottomLeftRadius: 6, border: `1px solid ${T.border}` }
              }
            >
              <div style={{ lineHeight: 1.45 }}>{m.body}</div>
              <div className="mt-0.5 text-right" style={{ opacity: 0.6, fontSize: 10 }}>
                {new Date(m.created_at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {viewerRole !== "admin" && (
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-2 flex gap-2 border-t pt-2" style={{ borderColor: T.border }}>
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="min-w-0 flex-1 rounded-xl px-3 py-2 text-xs outline-none"
            style={inputS}
          />
          <button type="submit" disabled={sending} aria-label="Send" className="rounded-xl px-3 py-2 disabled:opacity-60" style={btnA}>
            <Send size={14} />
          </button>
        </form>
      )}
    </div>
  );
}
