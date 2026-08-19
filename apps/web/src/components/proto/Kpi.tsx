import { ArrowRight, TrendingUp, type LucideIcon } from "lucide-react";
import { rgba } from "../../theme/theme";
import type { Theme } from "../../theme/theme";

export interface KpiDef {
  I: LucideIcon;
  label: string;
  v: number;
  isCount?: boolean;
  insight: string;
  act: string;
  go: () => void;
}

// Ported exactly from stitchd-v9.jsx lines 954-985.
export function KpiTile({ k, T, compact }: { k: KpiDef; T: Theme; compact?: boolean }) {
  const isCount = k.isCount;
  const v = k.v;
  const col = isCount ? (v > 0 ? T.warn : T.good) : v >= 75 ? T.good : v >= 50 ? T.warn : T.bad;
  const status = isCount ? (v > 0 ? "due soon" : "clear") : v >= 75 ? "on track" : v >= 50 ? "needs work" : "at risk";

  return (
    <button onClick={k.go} className={`lift press w-full rounded-xl border text-left ${compact ? "p-2" : "p-2.5"}`} style={{ background: T.panel, borderColor: T.border }}>
      <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2"}`}>
        <span className={`flex shrink-0 items-center justify-center rounded-lg ${compact ? "h-6 w-6" : "h-7 w-7"}`} style={{ background: rgba(col, 0.14), color: col }}>
          <k.I size={compact ? 12 : 14} />
        </span>
        <span className="min-w-0 flex-1 truncate font-bold" style={{ color: T.ink, fontSize: compact ? 11 : 12 }}>{k.label}</span>
        <span className="tnum shrink-0" style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: compact ? 15 : 17, color: col, lineHeight: 1 }}>
          {v}
          {!isCount && <span style={{ fontSize: 9, color: T.faint }}>%</span>}
        </span>
      </div>
      {!isCount && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.08) }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, v)}%`, background: col, transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
        </div>
      )}
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="rounded px-1 py-0.5" style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.4, background: rgba(col, 0.12), color: col }}>
          {status.toUpperCase()}
        </span>
        {!compact && <span className="min-w-0 flex-1 truncate" style={{ fontSize: 10, color: T.sub }}>{k.insight}</span>}
      </div>
      {!compact && (
        <div className="mt-1 flex items-center gap-0.5 text-xs font-semibold" style={{ color: T.accent }}>
          {k.act}
          <ArrowRight size={11} />
        </div>
      )}
    </button>
  );
}

export function KpiRail({ KPIS, T }: { KPIS: Record<string, KpiDef>; T: Theme }) {
  const order = ["chemistry", "budgetReady", "supplier", "guest", "planning", "payments"];
  return (
    <div className="stagger space-y-2">
      <div className="flex items-center gap-1.5 px-0.5">
        <TrendingUp size={12} style={{ color: T.gold }} />
        <span style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 11, letterSpacing: 1, color: T.sub }}>WEDDING HEALTH</span>
      </div>
      {order.map((key) => KPIS[key] && <KpiTile key={key} k={KPIS[key]} T={T} />)}
    </div>
  );
}
