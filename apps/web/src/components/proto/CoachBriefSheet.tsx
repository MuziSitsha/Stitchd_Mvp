import { X, AlertTriangle, MessageSquare } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Face } from "./Face";
import { SEV, BOOK, fmtR } from "./data";
import { useProtoState } from "../../state/ProtoState";

// Ported exactly from stitchd-v9.jsx lines 2650-2676.
export function CoachBriefSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { T } = useTheme();
  const { toast } = useProtoState();
  const w = BOOK.find((x) => x.id === id);
  if (!w) return null;

  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0" style={{ background: "rgba(5,5,10,0.65)" }} onClick={onClose} />
      <div className="rise relative w-full max-w-md rounded-t-3xl border p-5 sm:rounded-3xl" style={{ background: T.panel, borderColor: T.border, maxHeight: "85vh", overflowY: "auto" }}>
        <div className="mb-3 flex items-center gap-3">
          <Face seed={w.id} T={T} size={44} name={w.c} />
          <div className="min-w-0 flex-1">
            <div style={{ ...bigNum, fontSize: 17 }}>{w.c.toUpperCase()}</div>
            <div className="truncate text-xs" style={{ color: T.sub }}>{w.d} · {w.venue}</div>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-1.5" style={btnG}><X size={15} /></button>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {([
            ["Ready", w.ready, w.ready >= 70 ? T.good : w.ready >= 50 ? T.warn : T.bad],
            ["Days", w.days, T.ink],
            ["Guests", w.guests, T.ink],
            ["Open", w.open, w.open > 2 ? T.warn : T.ink],
          ] as [string, number, string][]).map(([l, v, c]) => (
            <div key={l} className="rounded-xl p-2" style={{ background: T.panel2 }}>
              <div style={{ ...bigNum, fontSize: 17, color: c }}>{v}</div>
              <div className="text-xs" style={{ color: T.sub }}>{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: rgba(SEV[w.risk], 0.1), color: SEV[w.risk] }}>
          <div className="mb-0.5 flex items-center gap-1.5 text-xs font-bold"><AlertTriangle size={12} />{w.risk.toUpperCase()} RISK</div>{w.note}
        </div>
        <div className="mt-3 text-xs font-bold" style={{ color: T.sub, letterSpacing: 1 }}>FEE · {fmtR(w.fee)} PLANNING RETAINER</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://wa.me/${w.wa}?text=${encodeURIComponent(`Hi ${w.c.split(" & ")[0]}, Lungi here — quick update on your ${w.d} event.`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold"
            style={btnA}
          >
            <MessageSquare size={14} />Message couple
          </a>
          <button onClick={() => { onClose(); toast(`${w.c} board is demo-only — Junior & Nadine is the live one`, "warn"); }} className="rounded-xl px-3 py-2.5 text-sm font-semibold" style={btnG}>Board</button>
        </div>
        <div className="mt-2 text-center text-xs" style={{ color: T.faint }}>One coordinator, four events, one place. Only Junior &amp; Nadine is fully built in this demo.</div>
      </div>
    </div>
  );
}
