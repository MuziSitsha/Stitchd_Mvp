import { useEffect, useState } from "react";
import { Send, Check, X } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { rgba } from "../../theme/theme";
import { supabase } from "../../lib/supabase";
import { respondToQuote } from "../../lib/functions";
import { Card } from "./Card";

interface QuoteItem {
  label: string;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
}

interface QuoteVersion {
  version: number;
  total_cents: number;
  note: string | null;
  quote_items: QuoteItem[];
}

interface Quote {
  ref: string;
  status: string;
  current_version: number;
  quote_versions: QuoteVersion[];
}

const rand = (cents: number) => `R${Math.round(cents / 100).toLocaleString("en-ZA")}`;

// The one piece of new client-facing UI in Phase E — lives inside the
// existing SupplierDrawer (which already renders this exact ticket
// relationship's confirmation status and message thread) rather than a new
// page, per the explicit answer that additive UI here is fine.
export function QuoteReceivedCard({ T, ticketId }: { T: Theme; ticketId: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error: fetchError } = await supabase
        .from("quotes")
        .select("ref, status, current_version, quote_versions(version, total_cents, note, quote_items(label, qty, unit_price_cents, line_total_cents))")
        .eq("ticket_id", ticketId)
        .maybeSingle();
      if (cancelled) return;
      if (fetchError) {
        console.error("QuoteReceivedCard: failed to load quote", fetchError.message);
        return;
      }
      setQuote(data as unknown as Quote | null);
    }
    load();
    const channel = supabase
      .channel(`quote-for-ticket-${ticketId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes", filter: `ticket_id=eq.${ticketId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_versions" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  if (!quote) return null;

  const latest = quote.quote_versions.find((v) => v.version === quote.current_version) ?? quote.quote_versions[quote.quote_versions.length - 1];
  const actionable = quote.status === "sent";
  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };

  async function respond(decision: "accept" | "decline" | "request_changes") {
    setBusy(true);
    setError(null);
    try {
      await respondToQuote(quote!.ref, decision, decision === "request_changes" ? changeNote : undefined);
      setShowChangeForm(false);
      setChangeNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond to quote");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card T={T} style={{ borderColor: rgba(T.gold, 0.5) }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold"><Send size={15} style={{ color: T.gold }} />Quote received</div>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: rgba(T.gold, 0.15), color: T.gold }}>{quote.status.replace("_", " ")}</span>
      </div>
      {latest && (
        <div className="space-y-1.5">
          {latest.quote_items.map((it, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span style={{ color: T.sub }}>{it.label} × {it.qty}</span>
              <span className="tnum font-bold">{rand(it.line_total_cents)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-1.5 text-sm font-bold" style={{ borderColor: T.border }}>
            <span>Total</span><span className="tnum">{rand(latest.total_cents)}</span>
          </div>
          {latest.note && <div className="text-xs" style={{ color: T.faint }}>{latest.note}</div>}
        </div>
      )}
      {error && <div className="mt-2 text-xs font-semibold" style={{ color: T.bad }}>{error}</div>}
      {actionable && (
        <div className="mt-2.5 space-y-2">
          {!showChangeForm ? (
            <div className="flex gap-2">
              <button onClick={() => respond("accept")} disabled={busy} className="press flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold disabled:opacity-60" style={btnA}>
                <Check size={13} />Accept
              </button>
              <button onClick={() => setShowChangeForm(true)} disabled={busy} className="press rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60" style={btnG}>
                Request changes
              </button>
              <button onClick={() => respond("decline")} disabled={busy} className="press rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <textarea
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="What would you like changed?"
                className="w-full rounded-lg px-2.5 py-2 text-xs outline-none"
                style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}`, minHeight: 56 }}
              />
              <div className="flex gap-1.5">
                <button onClick={() => respond("request_changes")} disabled={busy || !changeNote.trim()} className="press rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
                  {busy ? "Sending…" : "Send request"}
                </button>
                <button onClick={() => setShowChangeForm(false)} className="press rounded-lg px-3 py-1.5 text-[11px] font-bold" style={btnG}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
