import { X, Calculator, Info, ArrowRight } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Ring } from "./Ring";
import { useReadiness } from "../../state/useReadiness";
import type { LensKey } from "./AppShell";

// Ported exactly from stitchd-v9.jsx lines 2678-2717.
export function ReadinessDrawer({ onClose, setLens }: { onClose: () => void; setLens: (l: LensKey) => void }) {
  const { T } = useTheme();
  const { R, weightWhy, sug } = useReadiness(setLens);
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  const btnA = { background: T.accent, color: T.onAccent };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0" style={{ background: "rgba(5,5,10,0.6)" }} onClick={onClose} />
      <div className="rise relative w-full max-w-md rounded-t-3xl border p-5 sm:rounded-3xl" style={{ background: T.panel, borderColor: T.border, maxHeight: "85vh", overflowY: "auto" }}>
        <div className="mb-3 flex items-center gap-3">
          <Ring score={R.total} T={T} size={64} />
          <div className="flex-1">
            <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 18 }}>Path to 100</div>
            <div className="text-xs" style={{ color: T.sub }}>Do these to close the {100 - R.total}-point gap. Each acts live.</div>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-1.5" style={btnG}><X size={15} /></button>
        </div>

        <div className="mb-3 rounded-xl border p-3" style={{ borderColor: T.border, background: T.panel2 }}>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold" style={{ color: T.sub, letterSpacing: 1 }}><Calculator size={12} />HOW THIS NUMBER IS BUILT</div>
          <div className="space-y-2">
            {R.parts.map((p) => (
              <div key={p.k}>
                <div className="flex items-baseline gap-2 text-xs">
                  <span className="font-semibold" style={{ color: T.ink }}>{p.l}</span>
                  <span style={{ color: T.faint }}>{p.detail}</span>
                  <span className="ml-auto font-bold" style={{ color: T.ink }}>{Math.round((p.pct * p.w) / 100)}<span style={{ color: T.faint }}>/{p.w}</span></span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.1) }}>
                  <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.pct >= 75 ? T.good : p.pct >= 45 ? T.warn : T.bad, transition: "width .6s" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs font-bold" style={{ borderColor: T.border }}>
            <span>Total</span><span>{R.total} / 100</span>
          </div>
          {weightWhy.length > 0 && (
            <div className="mt-2 flex items-start gap-1.5 text-xs" style={{ color: T.gold }}>
              <Info size={11} className="mt-0.5 shrink-0" /><span>Weights moved by your priorities — {weightWhy.join("; ")}.</span>
            </div>
          )}
        </div>

        {R.total >= 100 ? (
          <div className="rounded-xl p-4 text-center text-sm font-bold" style={{ background: rgba(T.good, 0.12), color: T.good }}>100/100 — nothing left on the list.</div>
        ) : (
          <div className="space-y-2">
            {sug.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: T.border, background: T.panel2 }}>
                <div className="flex h-9 w-11 shrink-0 flex-col items-center justify-center rounded-lg" style={{ background: rgba(s.pts ? T.good : T.gold, 0.12) }}>
                  <span className="text-xs font-bold" style={{ color: s.pts ? T.good : T.gold }}>{s.pts ? `+${s.pts}` : `R${s.money}k`}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{s.t}</div>
                  {s.pts > 0 && <div className="text-xs" style={{ color: T.faint }}>takes you to {Math.min(100, R.total + s.pts)}</div>}
                </div>
                <button onClick={() => { s.go(); onClose(); }} className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={btnA}>Act <ArrowRight size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
