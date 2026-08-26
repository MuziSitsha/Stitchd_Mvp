import { useMemo, useState } from "react";
import { AlertTriangle, Star } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { WaitingOnYouCard, BookedSupplierCard } from "../components/proto/SupplierCards";
import { useProtoState } from "../state/ProtoState";
import { useLiveSupplierStatus } from "../state/useLiveSupplierStatus";
import { useLiveSupplierTickets } from "../state/useLiveSupplierTickets";
import { createSupplierTicket } from "../lib/functions";
import type { Supplier } from "../components/proto/data";

// "Your circle" — the Suppliers tab's default sub-screen. The rest of what
// used to live on this page (hero/KPI strip/brief/promos/Coach/Readiness/
// RSVP/Budget/Weather) now lives on Today, which owns the dashboard role
// in the new IA; this page is purely supplier management.
export function Squad() {
  const { T, pal } = useTheme();
  const { sup, toast, setSelSup } = useProtoState();
  const live = useLiveSupplierStatus();
  const tickets = useLiveSupplierTickets();
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const waiting = useMemo(() => sup.filter((s) => s.status !== "confirmed"), [sup]);
  const booked = useMemo(() => sup.filter((s) => s.status === "confirmed"), [sup]);

  // Raises a real supplier_tickets row so the supplier (or an admin) can say
  // yes/no from their own portal — ProtoState's ticket-reconciliation effect
  // then flips `s.status` for real once they do (see applyTicketOutcome).
  async function requestTicket(s: Supplier) {
    setRequestingId(s.id);
    try {
      await createSupplierTicket(s.name);
      toast(`Confirmation requested — ${s.name} will respond`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't request confirmation", "warn");
    } finally {
      setRequestingId(null);
    }
  }

  const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };

  return (
    <div className="rise space-y-3">
      {waiting.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-2 px-0.5">
            <AlertTriangle size={13} style={{ color: T.warn }} />
            <span style={{ ...bigNum, fontSize: 12, letterSpacing: 1.4 }}>WAITING ON YOU</span>
            <span className="rounded-full px-1.5 py-0.5" style={{ fontSize: 9, fontWeight: 800, background: rgba(T.warn, 0.14), color: T.warn }}>{waiting.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {waiting.map((s) => (
              <WaitingOnYouCard
                key={s.id}
                s={s}
                T={T}
                ticket={tickets.get(s.name)}
                requesting={requestingId === s.id}
                onOpen={() => setSelSup(s.id)}
                onSecure={() => requestTicket(s)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center gap-2 px-0.5">
          <Star size={13} style={{ color: T.gold }} fill="currentColor" />
          <span style={{ ...bigNum, fontSize: 12, letterSpacing: 1.4 }}>BOOKED AND PAID UP</span>
          <span className="rounded-full px-1.5 py-0.5" style={{ fontSize: 9, fontWeight: 800, background: rgba(T.ink, 0.08), color: T.sub }}>{booked.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {booked.map((s) => (
            <BookedSupplierCard key={s.id} s={s} T={T} pal={pal} live={live.get(s.name)} ticket={tickets.get(s.name)} onOpen={() => setSelSup(s.id)} />
          ))}
          {booked.length === 0 && <div className="col-span-full py-6 text-center text-xs" style={{ color: T.faint }}>Nobody's confirmed yet.</div>}
        </div>
      </div>
    </div>
  );
}
