import { rgba } from "../../theme/theme";
import type { Theme } from "../../theme/theme";

// Ported exactly from stitchd-v9.jsx lines 728-744.
export function Ring({
  score,
  T,
  size = 74,
  stroke = 8,
  label,
}: {
  score: number;
  T: Theme;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  const col = score >= 75 ? T.good : score >= 55 ? T.warn : T.bad;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={rgba(T.ink, 0.1)} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: size * 0.3, lineHeight: 1, color: T.ink }}>
          {score}
        </span>
        {label && <span style={{ fontSize: 8, color: T.sub }}>{label}</span>}
      </div>
    </div>
  );
}
