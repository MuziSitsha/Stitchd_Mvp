import { Fragment, useMemo, useState } from "react";
import { Star, MessageCircle, Clock, Sparkles } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba, type Theme } from "../../theme/theme";
import { Shot } from "../../components/proto/Shot";
import { STATUS_C, WA, fmtR, roleRank, CANDIDATE_SEED, type Supplier, type Candidate } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { useLiveSupplierStatus } from "../../state/useLiveSupplierStatus";
import { createSupplierTicket } from "../../lib/functions";

// "Find someone" — Suppliers tab's second sub-screen. Real discovery: for
// every role still "pending" (not yet confirmed), CANDIDATE_SEED carries
// one genuine alternative to compare against the current pick — held slots,
// price deltas, a real comparison note — and "Book" raises a real
// supplier_tickets row (createSupplierTicket) before swapping it into
// ProtoState (see swapCandidate). Confirmed roles have nothing left to
// decide, so their cards render read-only, same as "Your circle".
export function Marketplace() {
  const { T, pal } = useTheme();
  const { sup, setSelSup, swapCandidate, toast } = useProtoState();
  const live = useLiveSupplierStatus();
  const [filter, setFilter] = useState<string>("All");
  const [booking, setBooking] = useState<string | null>(null);

  const candidateRoles = useMemo(() => new Set(CANDIDATE_SEED.map((c) => c.role)), []);
  const roles = useMemo(() => {
    const seen = new Set<string>();
    return [...sup].sort((a, b) => roleRank(a.role) - roleRank(b.role)).map((s) => s.role).filter((r) => (seen.has(r) ? false : (seen.add(r), true)));
  }, [sup]);

  const withCandidates = useMemo(
    () => [...sup].filter((s) => candidateRoles.has(s.role)).sort((a, b) => roleRank(a.role) - roleRank(b.role)),
    [sup, candidateRoles],
  );
  const filtered = useMemo(
    () => withCandidates.filter((s) => filter === "All" || s.role === filter),
    [withCandidates, filter],
  );
  const rest = useMemo(
    () => [...sup].filter((s) => !candidateRoles.has(s.role) && (filter === "All" || s.role === filter)).sort((a, b) => roleRank(a.role) - roleRank(b.role)),
    [sup, candidateRoles, filter],
  );

  async function book(c: Candidate) {
    setBooking(c.id);
    try {
      await createSupplierTicket(c.name);
      swapCandidate(c.role, c);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't book — try again", "warn");
    } finally {
      setBooking(null);
    }
  }

  return (
    <div className="rise space-y-3">
      <div className="rounded-2xl border p-3.5" style={{ borderColor: rgba(T.accent, 0.4), background: `linear-gradient(120deg, ${rgba(T.accent, 0.16)}, ${rgba(T.accent, 0.05)})` }}>
        <div className="text-xs font-bold" style={{ color: T.accent, letterSpacing: 1 }}>{CANDIDATE_SEED.length} ALTERNATIVES WORTH A LOOK</div>
        <div className="mt-1 text-sm font-bold">Still deciding on {withCandidates.filter((s) => s.status === "pending").length} categories — here's what else is out there</div>
        <div className="text-xs" style={{ color: T.sub }}>Every role with an open decision has a real alternative to compare, priced and rated for 14 November.</div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["All", ...roles].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className="rounded-full px-3 py-1.5 text-xs font-bold"
            style={filter === r ? { background: T.accent, color: T.onAccent } : { background: T.panel2, color: T.sub }}
          >
            {r}
          </button>
        ))}
        <span className="ml-auto self-center text-xs" style={{ color: T.faint }}>{filtered.length + rest.length} supplier{filtered.length + rest.length === 1 ? "" : "s"}</span>
      </div>

      {/* One continuous dense grid — current pick and its alternative sit
          next to each other in card order (role badge on each card's photo
          already says which role, so no per-row headers needed to tell them
          apart), confirmed roles fill the rest. Minimizes scrolling by
          design: 3 across on desktop, 2 on tablet, 1 on mobile. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => {
          const c = CANDIDATE_SEED.find((x) => x.role === s.role);
          return (
            <Fragment key={s.id}>
              <DiscoveryCard s={s} T={T} pal={pal} verified={!!live.get(s.name)?.verified} onOpen={() => setSelSup(s.id)} tag="Currently holding" />
              {c && <CandidateCard c={c} T={T} pal={pal} booking={booking === c.id} onBook={() => book(c)} />}
            </Fragment>
          );
        })}
        {rest.map((s) => <DiscoveryCard key={s.id} s={s} T={T} pal={pal} verified={!!live.get(s.name)?.verified} onOpen={() => setSelSup(s.id)} />)}
      </div>
    </div>
  );
}

function CandidateCard({ c, T, pal, booking, onBook }: { c: Candidate; T: Theme; pal: number; booking: boolean; onBook: () => void }) {
  const waHref = `https://wa.me/27820000000?text=${encodeURIComponent(`Hi ${c.name}, it's Junior & Nadine — checking availability for 14 November 2026.`)}`;
  return (
    <div className="overflow-hidden rounded-2xl border-2" style={{ borderColor: c.badge ? T.accent : T.border, background: T.panel }}>
      <div className="relative">
        <Shot seed={c.id} T={T} pal={pal} h={170} />
        <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold" style={{ background: T.mode === "dark" ? T.panel2 : rgba("#FFFFFF", 0.93), color: T.ink }}>{c.role}</span>
        {c.badge && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold" style={{ background: T.accent, color: T.onAccent }}>
            {c.badge === "Held" && <Clock size={9} />}{c.badge}
          </span>
        )}
      </div>
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-base font-bold">{c.name}</span>
          <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold" style={{ color: T.gold }}><Star size={11} fill="currentColor" />{c.rating}</span>
        </div>
        <div className="truncate text-xs" style={{ color: T.sub }}>{c.area} · {c.style} · {c.reviews} reviews</div>
        <div className="mt-1.5 flex items-center justify-between gap-1.5">
          <span className="tnum text-lg font-extrabold" style={{ letterSpacing: -0.5 }}>{fmtR(c.price)}</span>
          {c.heldUntil && <span className="shrink-0 text-[10px] font-bold" style={{ color: T.warn }}>Holds until {c.heldUntil}</span>}
        </div>
        {c.compareNote && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded-lg p-1.5 text-[10.5px] leading-snug" style={{ background: rgba(T.gold, 0.1), color: T.ink }}>
            <Sparkles size={11} className="mt-0.5 shrink-0" style={{ color: T.warn }} />
            <span>{c.compareNote}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5 border-t p-2" style={{ borderColor: T.border }}>
        <button onClick={onBook} disabled={booking} className="press rounded-lg py-1.5 text-xs font-bold disabled:opacity-60" style={{ background: "#1A1726", color: "#fff" }}>
          {booking ? "Booking…" : "Book"}
        </button>
        <a href={waHref} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold" style={{ background: "transparent", color: T.sub, border: `1px solid ${T.border}` }}>
          <MessageCircle size={12} />Message
        </a>
      </div>
    </div>
  );
}

function DiscoveryCard({ s, T, pal, verified, onOpen, tag }: { s: Supplier; T: Theme; pal: number; verified: boolean; onOpen: () => void; tag?: string }) {
  const sc = STATUS_C(T)[s.status];
  const statusLabel = tag ?? (s.status === "confirmed" ? "Confirmed" : s.status === "issue" ? "Needs resolving" : "Still deciding");
  const waHref = `https://wa.me/${WA[s.id] || "27820000000"}?text=${encodeURIComponent(`Hi ${s.name}, it's Junior & Nadine — checking in on 14 November 2026.`)}`;

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border, background: T.panel }}>
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative">
          <Shot role={s.role} seed={s.id} T={T} pal={pal} h={170} />
          <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold" style={{ background: T.mode === "dark" ? T.panel2 : rgba("#FFFFFF", 0.93), color: T.ink }}>{s.role}</span>
          {verified && <span className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold" style={{ background: T.info, color: "#fff" }}>VERIFIED</span>}
        </div>
        <div className="p-3 pb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-base font-bold">{s.name}</span>
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold" style={{ color: T.gold }}><Star size={11} fill="currentColor" />{s.rating}</span>
          </div>
          <div className="truncate text-xs" style={{ color: T.sub }}>{s.sub}</div>
          <div className="mt-1.5 flex items-center justify-between gap-1.5">
            <span className="tnum text-lg font-extrabold" style={{ letterSpacing: -0.5 }}>{fmtR(s.price)}</span>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: rgba(sc, 0.14), color: sc }}>{statusLabel}</span>
          </div>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-1.5 border-t p-2" style={{ borderColor: T.border }}>
        <button onClick={onOpen} className="rounded-lg py-1.5 text-xs font-bold" style={{ background: T.accent, color: T.onAccent }}>View profile</button>
        <a href={waHref} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold" style={{ background: "transparent", color: T.sub, border: `1px solid ${T.border}` }}>
          <MessageCircle size={12} />Message
        </a>
      </div>
    </div>
  );
}
