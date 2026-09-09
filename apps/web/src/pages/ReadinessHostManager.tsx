import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Circle, HelpCircle } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { PortalShell, PortalCard } from "../components/PortalShell";

// WBS-04's real readiness engine, surfaced for the first time. Separate
// page from the client app's own ReadinessDrawer/useReadiness (Squad/Chat/
// Coach/Timeline) — same reasoning as RsvpHostManager vs pages/lenses/
// Rsvp.tsx: that drawer scores a hand-built demo dataset for the pitch, not
// a real booking's real obligations, and rewriting it to do both would
// break the demo to half-build this instead.
const RULE_LABEL: Record<string, string> = {
  confirmed_scope: "Confirmed scope",
  deposit_evidence: "Deposit evidence",
  named_contact: "Named delivery contact",
  arrival_plan: "Arrival & setup plan",
  category_evidence: "Category evidence",
  reconfirmation: "Current reconfirmation",
};
const BAND_COLOR = (T: ReturnType<typeof useTheme>["T"], band: string) =>
  ({ green: T.good, amber: T.warn, red: T.bad, grey: T.faint }[band] ?? T.faint);
const BAND_LABEL: Record<string, string> = { green: "On track", amber: "Needs attention", red: "At risk", grey: "Not assessed" };

interface Obligation { id: string; rule_key: string; weight: number; applicable: boolean; state: "satisfied" | "unsatisfied"; due_at: string | null }
interface ReadinessResult { score: number | null; band: string; satisfied_weight: number; applicable_weight: number; has_critical_blocker: boolean; has_overdue: boolean }
interface BookingRow {
  id: string;
  supplierName: string;
  ticketStatus: string;
  obligations: Obligation[];
  readiness: ReadinessResult | null;
}

export function ReadinessHostManager() {
  const { T } = useTheme();
  const { session, loading: authLoading } = useAuth();
  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [eventReadiness, setEventReadiness] = useState<{ required_count: number; assessed_count: number; worst_band: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const { data: event } = await supabase.from("events").select("id").eq("owner_id", session.user.id).maybeSingle();
    setEventId(event?.id ?? null);
    if (!event) { setLoading(false); return; }

    const { data: evReady, error: evErr } = await supabase.rpc("event_readiness", { p_event_id: event.id });
    if (evErr) setError(evErr.message);
    setEventReadiness(evReady ?? null);

    const { data: tickets, error: tErr } = await supabase
      .from("supplier_tickets")
      .select("id, status, suppliers(name), quotes(id, status, quote_versions(id, version, bookings(id)))")
      .eq("event_id", event.id);
    if (tErr) { setError(tErr.message); setLoading(false); return; }

    const rows: BookingRow[] = [];
    for (const t of (tickets ?? []) as unknown as { id: string; status: string; suppliers: { name: string } | null; quotes: { id: string; status: string; quote_versions: { id: string; version: number; bookings: { id: string }[] }[] }[] }[]) {
      for (const q of t.quotes ?? []) {
        for (const v of q.quote_versions ?? []) {
          for (const b of v.bookings ?? []) {
            const { data: obs } = await supabase.from("obligations").select("id, rule_key, weight, applicable, state, due_at").eq("booking_id", b.id);
            const { data: readiness } = await supabase.rpc("booking_readiness", { p_booking_id: b.id });
            rows.push({ id: b.id, supplierName: t.suppliers?.name ?? "Unknown supplier", ticketStatus: t.status, obligations: obs ?? [], readiness: readiness ?? null });
          }
        }
      }
    }
    setBookings(rows);
    setLoading(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`readiness-host-${eventId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "obligations" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, load]);

  async function toggleObligation(obligationId: string, current: Obligation) {
    const nextState = current.state === "satisfied" ? "unsatisfied" : "satisfied";
    await supabase.from("obligations").update({ state: nextState, updated_at: new Date().toISOString() }).eq("id", obligationId);
    await load();
  }
  async function toggleApplicable(obligationId: string, current: Obligation) {
    await supabase.from("obligations").update({ applicable: !current.applicable, updated_at: new Date().toISOString() }).eq("id", obligationId);
    await load();
  }

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm" style={{ background: T.bg, color: T.sub }}>Loading…</div>;
  }
  if (!session) {
    return <div className="flex min-h-screen items-center justify-center text-sm" style={{ background: T.bg, color: T.sub }}>Please sign in to view readiness.</div>;
  }
  if (!eventId) {
    return <div className="flex min-h-screen items-center justify-center p-4 text-center text-sm" style={{ background: T.bg, color: T.sub }}>No wedding set up on this account yet.</div>;
  }

  return (
    <PortalShell eyebrow="Real readiness" title="Are we ready?" signOutTo="/">
      {eventReadiness && (
        <PortalCard T={T} style={{ borderColor: BAND_COLOR(T, eventReadiness.worst_band) }}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: rgba(BAND_COLOR(T, eventReadiness.worst_band), 0.14), color: BAND_COLOR(T, eventReadiness.worst_band) }}
            >
              {BAND_LABEL[eventReadiness.worst_band] === "Not assessed" ? "—" : eventReadiness.worst_band.toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: T.ink }}>{BAND_LABEL[eventReadiness.worst_band] ?? eventReadiness.worst_band}</div>
              <div className="text-xs" style={{ color: T.sub }}>{eventReadiness.assessed_count} of {eventReadiness.required_count} bookings assessed</div>
            </div>
          </div>
        </PortalCard>
      )}

      {error && <div className="rounded-xl p-2.5 text-center text-xs font-semibold" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>{error}</div>}

      {bookings.length === 0 && (
        <PortalCard T={T}><div className="text-xs" style={{ color: T.sub }}>No accepted bookings yet — readiness tracks what's actually confirmed, not requests still in flight.</div></PortalCard>
      )}

      {bookings.map((b) => {
        const r = b.readiness;
        const band = r?.band ?? "grey";
        return (
          <PortalCard key={b.id} T={T}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: T.ink }}>{b.supplierName}</span>
              <div className="flex items-center gap-2">
                {r?.has_critical_blocker && <span className="flex items-center gap-1 text-xs font-bold" style={{ color: T.bad }}><AlertTriangle size={12} />Blocked</span>}
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: rgba(BAND_COLOR(T, band), 0.14), color: BAND_COLOR(T, band) }}>
                  {r?.score != null ? `${r.score}%` : "Not assessed"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {b.obligations.map((o) => (
                <div key={o.id} className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ background: T.panel2, opacity: o.applicable ? 1 : 0.5 }}>
                  <button onClick={() => toggleObligation(o.id, o)} disabled={!o.applicable} aria-label={`Toggle ${RULE_LABEL[o.rule_key]}`}>
                    {o.state === "satisfied" ? <CheckCircle2 size={16} style={{ color: T.good }} /> : <Circle size={16} style={{ color: T.faint }} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold" style={{ color: T.ink }}>{RULE_LABEL[o.rule_key]} <span style={{ color: T.faint }}>· {o.weight}pt</span></div>
                    {o.due_at && <div className="text-[10px]" style={{ color: new Date(o.due_at) < new Date() && o.state === "unsatisfied" ? T.bad : T.faint }}>Due {new Date(o.due_at).toLocaleDateString()}</div>}
                  </div>
                  <button onClick={() => toggleApplicable(o.id, o)} className="shrink-0 text-[10px] font-bold" style={{ color: T.faint }} title="Mark not applicable">
                    {o.applicable ? "N/A?" : <HelpCircle size={12} />}
                  </button>
                </div>
              ))}
            </div>
          </PortalCard>
        );
      })}
    </PortalShell>
  );
}
