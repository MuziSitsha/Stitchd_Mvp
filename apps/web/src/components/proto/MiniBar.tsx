import { rgba } from "../../theme/theme";
import type { Theme } from "../../theme/theme";

// Ported exactly from stitchd-v9.jsx lines 718-727.
export function MiniBar({
  label,
  pct,
  c,
  T,
  right,
}: {
  label: string;
  pct: number;
  c: string;
  T: Theme;
  right?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs" style={{ color: T.sub }}>
        <span>{label}</span>
        <span className="font-semibold" style={{ color: T.ink }}>
          {right ?? `${pct}%`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.08) }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, pct)}%`, background: c, transition: "width .8s cubic-bezier(.2,.8,.2,1)" }}
        />
      </div>
    </div>
  );
}
