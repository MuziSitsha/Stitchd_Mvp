import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { supabase } from "../../lib/supabase";

interface ThreadMessage {
  id: string;
  sender_role: "client" | "supplier";
  body: string;
  created_at: string;
}

// Shared by SupplierDrawer.tsx (client side), SupplierPortal.tsx (supplier
// side), and AdminConsole.tsx's read-only Conversations oversight — all point
// at the same ticket_messages row set, live, so a message sent from either
// participant shows up everywhere in real time. Bubble styling matches
// Chat.tsx's existing Lungi-persona thread exactly, for visual consistency,
// even though this is a real backend thread. Admin has no "mine" side to
// align right, so it omits `senderRole` and gets every bubble left-aligned
// with a role label instead, and `readOnly` to drop the composer entirely.
export function TicketThread({
  T, ticketId, senderRole, readOnly,
}: {
  T: Theme;
  ticketId: string;
  senderRole?: "client" | "supplier";
  readOnly?: boolean;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("id, sender_role, body, created_at")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("TicketThread: failed to load ticket_messages", error.message);
        return;
      }
      setMessages((data as unknown as ThreadMessage[]) ?? []);
    }

    load();

    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send() {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: userRes.user?.id,
      sender_role: senderRole,
      body: text,
    });
    if (!error) setBody("");
    setSending(false);
  }

  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const btnA = { background: T.accent, color: T.onAccent };

  return (
    <div className="flex flex-col">
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No messages yet — say hello.</div>}
        {messages.map((m) => {
          const mine = senderRole !== undefined && m.sender_role === senderRole;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2 text-xs"
                style={
                  mine
                    ? { background: T.accent, color: T.onAccent, borderBottomRightRadius: 6 }
                    : { background: T.panel2, color: T.ink, borderBottomLeftRadius: 6, border: `1px solid ${T.border}` }
                }
              >
                {senderRole === undefined && (
                  <div className="mb-0.5 text-[10px] font-bold uppercase" style={{ color: T.faint, letterSpacing: 0.5 }}>{m.sender_role}</div>
                )}
                <div style={{ lineHeight: 1.45 }}>{m.body}</div>
                <div className="mt-0.5 text-right" style={{ opacity: 0.6, fontSize: 10 }}>
                  {new Date(m.created_at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {!readOnly && (
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="mt-2 flex gap-2 border-t pt-2"
          style={{ borderColor: T.border }}
        >
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
