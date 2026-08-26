import { CheckCircle2, ChevronRight, Clock, Ticket } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { rgba } from "../../theme/theme";
import { Card } from "./Card";
import { Shot } from "./Shot";
import { STATUS_C, WA, fmtR, type Supplier } from "./data";
import type { LiveSupplierStatus } from "../../state/useLiveSupplierStatus";
import type { TicketStatus } from "../../state/useLiveSupplierTickets";

// New card pair replacing the FIFA-card Core Team/Bench split on Squad, per
// the "Waiting on you" / "Booked and paid up" pattern from the UI redesign
// handoff. Built with the app's own theme tokens (not the handoff's literal
// light-mode hex values) so it stays visually consistent with the rest of
// the still-dark-mode app — see plan notes for the full rationale.

// The primary button raises a real supplier_tickets row (via onSecure ->
// createSupplierTicket in Squad.tsx) instead of a local-only status flip —
// the supplier or an admin then says yes/no for real from their own portal,
// and ProtoState's ticket-reconciliation effect flips `s.status` once they
// do (see applyTicketOutcome). `ticket` is what makes the three real states
// (no ticket yet / awaiting their response / they said no) visible here.
export function WaitingOnYouCard({
  s, T, ticket, requesting, onOpen, onSecure,
}: {
  s: Supplier; T: Theme; ticket?: TicketStatus; requesting?: boolean; onOpen: () => void; onSecure: () => void;
}) {
  const declined = ticket?.status === "declined";
  const pending = ticket?.status === "pending";
  const issue = s.status === "issue" || declined;
  // T.warn is a text-only color (dark gold-brown, for reading on a cream
  // tint) — using it as the tint's own background source produced a muddy
  // brown instead of the reference's crisp cream-gold, so badge/avatar tints
  // key off T.gold (the actual gold) while text/border stay on T.warn/T.bad.
  const accent = issue ? T.bad : T.warn;
  const tint = issue ? T.bad : T.gold;
  const initials = s.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const badgeLabel = pending ? "Awaiting response" : declined ? "Needs attention" : issue ? "Needs resolving" : "Pending";
  const noteLine = declined
    ? (s.issueNote ?? "They said no — check in with them.")
    : pending
      ? `Ticket ${ticket.ref} sent — waiting on ${s.name} or an admin.`
      : (s.issueNote ?? s.waitNote ?? `Confirm ${s.name} to lock in your date.`);
  const btnLabel = requesting ? "Sending…" : pending ? "Awaiting response" : declined ? "Follow up" : issue ? "Resolve" : "Confirm";

  return (
    <Card
      T={T}
      style={
        issue
          ? { borderColor: rgba(T.bad, 0.55), borderLeftWidth: 4, borderLeftColor: T.bad, background: rgba(T.bad, 0.05) }
          : { borderColor: rgba(tint, 0.5) }
      }
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: rgba(tint, 0.16), color: accent }}>
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold">{s.name}</span>
            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: rgba(tint, 0.16), color: accent }}>
              {pending && <Clock size={10} />}
              {badgeLabel}
            </span>
          </div>
          <div className="mt-0.5 text-xs" style={{ color: T.sub }}>{s.role} · {s.rating}★ {s.reviews} reviews</div>
          <div className="mt-1.5 text-xs" style={{ color: T.sub }}>{noteLine}</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onSecure} disabled={pending || requesting} className="flex-1 rounded-lg py-2 text-xs font-bold press disabled:opacity-60" style={{ background: issue || declined ? T.bad : T.mode === "dark" ? T.panel2 : T.ink, color: T.mode === "dark" && !issue && !declined ? T.ink : "#fff" }}>
          {btnLabel}
        </button>
        <button onClick={onOpen} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "transparent", color: T.sub, border: `1px solid ${T.border}` }}>
          Open <ChevronRight size={12} />
        </button>
      </div>
    </Card>
  );
}

export function BookedSupplierCard({
  s, T, pal, live, ticket, onOpen,
}: {
  s: Supplier;
  T: Theme;
  pal: number;
  live?: LiveSupplierStatus;
  ticket?: TicketStatus;
  onOpen: () => void;
}) {
  const sc = STATUS_C(T)[s.status];
  const waMsg = encodeURIComponent(`Hi ${s.name}, it's Junior & Nadine — following up on your booking for 14 November 2026.`);
  const waHref = `https://wa.me/${WA[s.id] || "27820000000"}?text=${waMsg}`;

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border, background: T.panel }}>
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative">
          <Shot role={s.role} seed={s.id} T={T} pal={pal} h={124} />
          {live?.verified && (
            <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold" style={{ background: rgba("#FFFFFF", 0.93), color: T.ink }}>
              VERIFIED
            </span>
          )}
          {ticket && (
            <span
              className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold"
              style={{ background: ticket.status === "confirmed" ? T.good : T.warn, color: ticket.status === "confirmed" ? "#fff" : T.onGold }}
            >
              {ticket.status === "confirmed" ? <CheckCircle2 size={9} /> : <Ticket size={9} />}
              {ticket.status === "confirmed" ? "CONFIRMED" : "TICKET"}
            </span>
          )}
        </div>
        <div className="p-3 pb-2">
          <div className="truncate text-sm font-bold">{s.name}</div>
          <div className="truncate text-xs" style={{ color: T.sub }}>{s.role} · {s.rating}★</div>
          <div className="mt-1.5 flex items-center justify-between gap-1.5">
            <span className="tnum text-sm font-bold">{fmtR(s.price)}</span>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: rgba(sc, 0.14), color: sc }}>Confirmed</span>
          </div>
        </div>
      </button>
      <div className="border-t px-3 py-2" style={{ borderColor: T.border }}>
        <a href={waHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="block text-center text-xs font-bold" style={{ color: T.accent }}>
          Message
        </a>
      </div>
    </div>
  );
}
