import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { rgba } from "../../theme/theme";
import { supabase } from "../../lib/supabase";
import { transitionTicket, type TicketStatusV2 } from "../../lib/functions";

interface TicketComment {
  id: string;
  author_role: "client" | "supplier" | "admin";
  body: string;
  created_at: string;
}

// The doc's Figure 10 state machine, mirrored client-side purely to know
// which transition buttons to offer — tickets-transition enforces the real
// rule server-side, this is just so the UI doesn't show illegal buttons.
const NEXT_STATUSES: Record<string, TicketStatusV2[]> = {
  open: ["assigned"],
  assigned: ["accepted"],
  accepted: ["in_progress"],
  in_progress: ["waiting_client", "waiting_supplier", "resolved"],
  waiting_client: ["in_progress"],
  waiting_supplier: ["in_progress"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["in_progress"],
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open", assigned: "Assigned", accepted: "Accepted", in_progress: "In progress",
  waiting_client: "Waiting on client", waiting_supplier: "Waiting on supplier",
  resolved: "Resolved", closed: "Closed", reopened: "Reopened",
};

const STATUS_TONE: Record<string, "good" | "warn" | "bad" | "accent" | "faint"> = {
  open: "warn", assigned: "warn", accepted: "accent", in_progress: "accent",
  waiting_client: "warn", waiting_supplier: "warn",
  resolved: "good", closed: "faint", reopened: "bad",
};

export function TicketV2Card({
  T, ticketId, ticketRef, status, viewerRole, onChanged,
}: {
  T: Theme;
  ticketId: string;
  ticketRef: string;
  status: string;
  viewerRole: "supplier" | "admin" | "client";
  onChanged?: () => void;
}) {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [pendingTerminal, setPendingTerminal] = useState<TicketStatusV2 | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabase
        .from("ticket_comments")
        .select("id, author_role, body, created_at")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (fetchError) console.error("TicketV2Card: failed to load ticket_comments", fetchError.message);
      else setComments((data as unknown as TicketComment[]) ?? []);
    }
    load();
    const channel = supabase
      .channel(`ticket-comments-${ticketId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_comments", filter: `ticket_id=eq.${ticketId}` }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [comments]);

  async function sendComment() {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error: insertErr } = await supabase.from("ticket_comments").insert({
      ticket_id: ticketId,
      author_id: userRes.user?.id,
      author_role: viewerRole,
      body: text,
    });
    if (insertErr) setError(insertErr.message);
    else setBody("");
    setSending(false);
  }

  async function doTransition(to: TicketStatusV2, reason?: string) {
    setBusy(true);
    setError(null);
    try {
      await transitionTicket(ticketRef, to, reason);
      setPendingTerminal(null);
      setResolutionDraft("");
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ticket");
    } finally {
      setBusy(false);
    }
  }

  // A client can create and comment on a ticket, and push back with
  // "reopened" if resolved/closed too soon — driving the internal
  // open→assigned→accepted→in_progress workflow is supplier/admin's job.
  const allNext = NEXT_STATUSES[status] ?? [];
  const next = viewerRole === "client" ? allNext.filter((s) => s === "reopened") : allNext;
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };

  return (
    <div className="mt-2.5 space-y-2.5 border-t pt-2.5" style={{ borderColor: T.border }}>
      {error && <div className="text-xs font-semibold" style={{ color: T.bad }}>{error}</div>}

      <div className="flex flex-wrap gap-1.5">
        {next.map((s) =>
          s === "resolved" || s === "closed" ? (
            <button key={s} disabled={busy} onClick={() => setPendingTerminal(s)} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
              {s === "resolved" ? "Resolve…" : "Close…"}
            </button>
          ) : (
            <button key={s} disabled={busy} onClick={() => doTransition(s)} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnG}>
              {STATUS_LABEL[s]}
            </button>
          ),
        )}
      </div>

      {pendingTerminal && (
        <div className="rounded-xl border p-2.5" style={{ borderColor: rgba(T.gold, 0.4), background: rgba(T.gold, 0.08) }}>
          <div className="mb-1.5 text-xs font-bold">Resolution summary (required)</div>
          <textarea
            value={resolutionDraft}
            onChange={(e) => setResolutionDraft(e.target.value)}
            placeholder="What was done to resolve this?"
            className="w-full rounded-lg px-2.5 py-2 text-xs outline-none"
            style={{ ...inputS, minHeight: 60 }}
          />
          <div className="mt-1.5 flex gap-1.5">
            <button disabled={busy || !resolutionDraft.trim()} onClick={() => doTransition(pendingTerminal, resolutionDraft)} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
              Confirm {pendingTerminal === "resolved" ? "resolve" : "close"}
            </button>
            <button onClick={() => setPendingTerminal(null)} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={btnG}>Cancel</button>
          </div>
        </div>
      )}

      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {comments.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No comments yet.</div>}
        {comments.map((c) => {
          const mine = c.author_role === viewerRole;
          return (
            <div key={c.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2 text-xs"
                style={mine ? { background: T.accent, color: T.onAccent, borderBottomRightRadius: 6 } : { background: T.panel2, color: T.ink, borderBottomLeftRadius: 6, border: `1px solid ${T.border}` }}
              >
                <div className="mb-0.5 text-[10px] font-bold uppercase" style={{ color: mine ? rgba(T.onAccent, 0.75) : T.faint, letterSpacing: 0.5 }}>{c.author_role}</div>
                <div style={{ lineHeight: 1.45 }}>{c.body}</div>
                <div className="mt-0.5 text-right" style={{ opacity: 0.6, fontSize: 10 }}>
                  {new Date(c.created_at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendComment(); }} className="flex gap-2">
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment…" className="min-w-0 flex-1 rounded-xl px-3 py-2 text-xs outline-none" style={inputS} />
        <button type="submit" disabled={sending} aria-label="Send" className="rounded-xl px-3 py-2 disabled:opacity-60" style={btnA}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

export { STATUS_LABEL as TICKET_STATUS_LABEL, STATUS_TONE as TICKET_STATUS_TONE };
