import { Star, Crown, AlertTriangle, MessageSquare } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Chip } from "../../components/proto/Chip";
import { Face } from "../../components/proto/Face";
import { SEV, BOOK, fmtR } from "../../components/proto/data";
import { useReadiness } from "../../state/useReadiness";
import { useProtoState } from "../../state/ProtoState";
import type { LensKey } from "../../components/proto/AppShell";

// Ported exactly from stitchd-v9.jsx lines 2521-2555.
export function Coach({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T } = useTheme();
  const { R } = useReadiness();
  const { setCoachSel } = useProtoState();

  const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };
  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };

  return (
    <div className="space-y-3 rise">
      <Card T={T} className="flex items-center gap-3">
        <Face seed="coach" T={T} size={52} name="Lungi Dlodlo" />
        <div className="min-w-0 flex-1">
          <div style={{ ...bigNum, fontSize: 19 }}>LUNGI DLODLO</div>
          <div className="text-xs" style={{ color: T.sub }}>VIP Hosting · Lead Planner &amp; Strategist · {BOOK.length} active events</div>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold" style={{ color: T.gold }}><Star size={11} fill="currentColor" />4.9 · 127 reviews</div>
        </div>
        <Chip c={T.gold} T={T}><Crown size={11} />Coach view</Chip>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        {([
          { l: "Revenue booked", v: fmtR(BOOK.reduce((a, w) => a + w.fee, 0)), c: T.good },
          { l: "Open tickets", v: BOOK.reduce((a, w) => a + w.open, 0), c: T.warn },
          { l: "At risk", v: BOOK.filter((w) => w.risk === "high").length, c: T.bad },
        ] as { l: string; v: string | number; c: string }[]).map((x) => (
          <div key={x.l} className="rounded-2xl border p-3 text-center" style={{ background: T.panel, borderColor: T.border }}>
            <div style={{ ...bigNum, fontSize: 20, color: x.c }}>{x.v}</div>
            <div className="mt-1 text-xs" style={{ color: T.sub }}>{x.l}</div>
          </div>
        ))}
      </div>

      <div className="text-xs font-bold" style={{ color: T.sub, letterSpacing: 1 }}>BOOK OF WORK · SORTED BY RISK</div>
      {BOOK.map((w) => {
        const live = w.id === "w2";
        const ready = live ? R.total : w.ready;
        return (
          <Card key={w.id} T={T} style={{ borderColor: w.risk === "high" ? rgba(T.bad, 0.5) : live ? rgba(T.accent, 0.5) : T.border }}>
            <div className="flex items-center gap-3">
              <Face seed={w.id} T={T} name={w.c} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-bold">{w.c}</span>
                  <Chip c={SEV[w.risk]} T={T}>{w.risk} risk</Chip>
                  {live && <Chip c={T.accent} T={T}>open now</Chip>}
                </div>
                <div className="truncate text-xs" style={{ color: T.sub }}>{w.d} · {w.days} days out · {w.venue}</div>
              </div>
              <div className="shrink-0 text-right">
                <div style={{ ...bigNum, fontSize: 19, color: ready >= 70 ? T.good : ready >= 50 ? T.warn : T.bad }}>{ready}</div>
                <div style={{ fontSize: 8, color: T.faint, letterSpacing: 1 }}>READY</div>
              </div>
            </div>
            <div className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs" style={{ background: rgba(SEV[w.risk], 0.1), color: SEV[w.risk] }}>
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />{w.note}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs" style={{ color: T.faint }}>{w.guests} guests · {fmtR(w.fee)} fee · {w.open} open</span>
              <div className="ml-auto flex gap-1.5">
                {live ? (
                  <button onClick={() => setLens("squad")} className="rounded-lg px-2.5 py-1.5 text-xs font-bold" style={btnA}>Open board</button>
                ) : (
                  <button onClick={() => setCoachSel(w.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold" style={btnA}>Open brief</button>
                )}
                <a href={`https://wa.me/${w.wa}?text=${encodeURIComponent(`Hi ${w.c.split(" & ")[0]}, Lungi here — checking in on your ${w.d} event.`)}`} target="_blank" rel="noreferrer" className="flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={btnG}>
                  <MessageSquare size={12} />
                </a>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
