import { Store, AlertTriangle, ArrowLeftRight, Star, Plus, ShieldCheck, Zap, Award } from "lucide-react";
import { rgba } from "../../theme/theme";
import type { Theme } from "../../theme/theme";
import { PALETTES } from "../../theme/palettes";
import { PALETTE_ROLES } from "../../theme/palettes";
import { ROLE_ICON, POS, perfScore, fmtR, STATUS_C, type Supplier } from "./data";
import { Shot } from "./Shot";
import { Bust } from "./Bust";
import type { LiveSupplierStatus } from "../../state/useLiveSupplierStatus";

// Ported exactly from stitchd-v9.jsx lines 750-843 (TIER, POS already in
// data.ts, FutCard, EmptySlot) — the FIFA-Ultimate-Team-style supplier card.
export const TIER = (score: number) =>
  score >= 88
    ? { a: "#F5D77A", b: "#B9852B", ink: "#2A1E05", name: "GOLD" }
    : score >= 80
      ? { a: "#DDE3EA", b: "#8D9BA9", ink: "#1B2129", name: "SILVER" }
      : { a: "#E0A878", b: "#9A5F30", ink: "#2A1608", name: "BRONZE" };

export function FutCard({
  s,
  T,
  pal,
  onOpen,
  onSecure,
  onMove,
  draggable,
  onDragStart,
  priority,
  live,
  w = 156,
}: {
  s: Supplier;
  T: Theme;
  pal: number;
  onOpen?: () => void;
  onSecure?: () => void;
  onMove?: () => void;
  draggable?: boolean;
  onDragStart?: React.DragEventHandler;
  priority?: boolean;
  live?: LiveSupplierStatus;
  w?: number;
}) {
  const perf = perfScore(s);
  const tier = TIER(perf);
  const Icon = ROLE_ICON[s.role] || Store;
  const sc = STATUS_C(T)[s.status];
  const pale = PALETTE_ROLES[s.role];
  const stats: [string, number][] = [["TIM", s.onTime], ["BOK", s.rebook], ["RSP", Math.max(1, 24 - s.resp)]];

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className="group press relative shrink-0 select-none"
      style={{ width: w, cursor: draggable ? "grab" : "pointer" }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 14,
          background: `linear-gradient(158deg, ${tier.a} 0%, ${tier.b} 58%, ${tier.a} 100%)`,
          padding: 2.5,
          boxShadow:
            s.status === "issue"
              ? `0 0 0 2px ${T.bad}, 0 10px 22px ${rgba(T.bad, 0.3)}`
              : s.status === "confirmed"
                ? `0 0 0 2px ${T.good}, 0 10px 22px rgba(0,0,0,.35)`
                : `0 8px 20px rgba(0,0,0,.3)`,
        }}
      >
        <button
          onClick={onOpen}
          className="block w-full text-left"
          style={{ borderRadius: 12, overflow: "hidden", background: rgba("#0A0A0E", 0.9) }}
        >
          <div
            className="relative"
            style={{ height: w * 0.78, background: `linear-gradient(160deg, ${rgba(tier.a, 0.5)}, ${rgba(sc, 0.3)})` }}
          >
            <Shot
              role={s.role}
              seed={s.id + "p"}
              T={T}
              pal={pal}
              h={w * 0.78}
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(180deg, ${rgba(tier.b, 0.5)} 0%, transparent 38%, rgba(6,6,12,.86) 100%)` }}
            />
            <div className="absolute left-2 top-1.5 rounded-lg px-1.5 py-1 text-center" style={{ background: rgba("#0A0A0E", 0.55) }}>
              <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 26, lineHeight: 0.94, color: tier.a, textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>{perf}</div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2, marginTop: 1, color: tier.a }}>{POS[s.role] || "SUP"}</div>
              <div className="mx-auto my-1" style={{ width: 20, height: 1.5, background: rgba(tier.a, 0.5) }} />
              <Icon size={12} style={{ color: tier.a, opacity: 0.9 }} />
            </div>
            <span
              className="absolute right-2 top-2 h-3 w-3 rounded-full"
              style={{ background: sc, boxShadow: `0 0 0 2px ${rgba("#000", 0.4)}` }}
              title={s.status}
            />
            {priority && (
              <span
                className="absolute right-0 top-9 rounded-l px-1.5 py-0.5"
                style={{ background: T.gold, color: T.onGold, fontSize: 7.5, fontWeight: 800, letterSpacing: 0.6 }}
              >
                PRIORITY
              </span>
            )}
            {s.viaBundle && (
              <span
                className="absolute bottom-9 left-2 rounded px-1.5 py-0.5"
                style={{ background: T.gold, color: T.onGold, fontSize: 7.5, fontWeight: 800 }}
              >
                IN PACKAGE
              </span>
            )}
            {(live?.featured || live?.verified || perf > 90) && (
              <div className="absolute bottom-9 right-2 flex flex-col items-end gap-1">
                {live?.featured && (
                  <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5" style={{ background: T.accent, color: T.onAccent, fontSize: 7.5, fontWeight: 800, letterSpacing: 0.5 }}>
                    <Zap size={8} />BOOSTED
                  </span>
                )}
                {live?.verified && (
                  <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5" style={{ background: T.info, color: "#fff", fontSize: 7.5, fontWeight: 800, letterSpacing: 0.5 }}>
                    <ShieldCheck size={8} />VERIFIED
                  </span>
                )}
                {perf > 90 && (
                  <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5" style={{ background: "linear-gradient(135deg, #F5D77A, #B9852B)", color: "#2A1E05", fontSize: 7.5, fontWeight: 800, letterSpacing: 0.5 }}>
                    <Award size={8} />90+
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="px-2 pb-1 pt-1 text-center">
            <div className="truncate" style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 10.5, letterSpacing: 0.4, color: "#F4F1EA" }}>
              {s.name.toUpperCase()}
            </div>
            <div className="mx-auto my-1" style={{ height: 1, width: "82%", background: rgba(tier.a, 0.35) }} />
          </div>
          <div className="grid grid-cols-3 px-2 pb-1.5">
            {stats.map(([l, v]) => (
              <div key={l} className="text-center">
                <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 11, color: "#F4F1EA", lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: 0.8, color: rgba("#F4F1EA", 0.55) }}>{l}</div>
              </div>
            ))}
          </div>
          {pale && (
            <div className="flex" style={{ height: 4 }}>
              {PALETTES[pal].cols.map((c) => (
                <span key={c} className="flex-1" style={{ background: c }} />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between px-2 py-1" style={{ background: rgba("#000", 0.35) }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, color: rgba("#F4F1EA", 0.6), letterSpacing: 0.5 }}>
              {s.viaBundle ? "INCL." : fmtR(s.price).toUpperCase()}
            </span>
            <span className="flex items-center gap-0.5" style={{ fontSize: 8.5, fontWeight: 800, color: tier.a }}>
              <Star size={8} fill="currentColor" />
              {s.rating}
            </span>
          </div>
        </button>
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        {onMove && (
          <button
            onClick={onMove}
            aria-label={`Move ${s.name}`}
            className="flex h-6 items-center gap-0.5 rounded px-1.5"
            style={{ background: T.panel2, color: T.sub, fontSize: 9, fontWeight: 700 }}
          >
            <ArrowLeftRight size={9} />
            {s.zone === "core" ? "BENCH" : "CORE"}
          </button>
        )}
        <button
          onClick={onSecure}
          className="ml-auto flex h-6 items-center rounded px-2"
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 0.3,
            ...(s.status === "confirmed"
              ? { background: T.good, color: "#fff" }
              : s.status === "issue"
                ? { background: T.bad, color: "#fff" }
                : { background: T.accent, color: T.onAccent }),
          }}
        >
          {s.status === "confirmed" ? "✓ LOCKED" : s.status === "issue" ? "RESOLVE" : "CONFIRM"}
        </button>
      </div>
      {s.status === "issue" && (
        <div className="mt-1 flex items-start gap-1" style={{ fontSize: 9, color: T.bad, lineHeight: 1.25 }}>
          <AlertTriangle size={9} className="mt-0.5 shrink-0" />
          {s.issueNote}
        </div>
      )}
    </div>
  );
}

export function EmptySlot({
  T,
  role,
  onFill,
  w = 156,
  hint,
}: {
  T: Theme;
  role?: string;
  onFill?: () => void;
  w?: number;
  hint?: string;
}) {
  return (
    <button onClick={onFill} className="group relative shrink-0 text-left" style={{ width: w }}>
      <div
        className="relative overflow-hidden"
        style={{ borderRadius: 14, padding: 2.5, background: `repeating-linear-gradient(135deg, ${rgba(T.faint, 0.28)} 0 6px, transparent 6px 12px)` }}
      >
        <div style={{ borderRadius: 12, overflow: "hidden", background: rgba(T.ink, T.mode === "dark" ? 0.06 : 0.04) }}>
          <div className="relative flex items-center justify-center" style={{ height: w * 0.78 }}>
            <span style={{ width: "58%", opacity: 0.4 }}>
              <Bust T={T} tone={T.faint} />
            </span>
            <span className="absolute" style={{ bottom: 8, left: 8, fontSize: 9, fontWeight: 800, letterSpacing: 1, color: T.faint }}>
              {role ? POS[role] || "SUP" : "OPEN"}
            </span>
          </div>
          <div className="px-2 pb-2 pt-1 text-center">
            <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 10, color: T.faint, letterSpacing: 0.4 }}>EMPTY SLOT</div>
            <div className="mt-1 flex items-center justify-center gap-1" style={{ fontSize: 8.5, color: T.accent, fontWeight: 800 }}>
              <Plus size={9} />
              {hint || "FILL"}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
