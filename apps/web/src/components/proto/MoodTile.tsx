import type { ReactNode } from "react";
import { PALETTES } from "../../theme/palettes";
import type { Theme } from "../../theme/theme";

// Ported exactly from stitchd-v9.jsx lines 696-717 — mood board drawn purely
// from the palette's own colors, no stock photo needed.
export function MoodTile({ pal, h = 120, children }: { T: Theme; pal: number; h?: number; children?: ReactNode }) {
  const P = PALETTES[pal];
  return (
    <div className="relative overflow-hidden" style={{ height: h, borderRadius: 12 }}>
      <svg viewBox="0 0 200 120" preserveAspectRatio="none" width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id={`m${pal}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={P.cols[1]} />
            <stop offset="55%" stopColor={P.cols[0]} />
            <stop offset="100%" stopColor={P.cols[2]} />
          </linearGradient>
        </defs>
        <rect width="200" height="120" fill={`url(#m${pal})`} />
        <circle cx="152" cy="30" r="30" fill={P.cols[4]} opacity="0.34" />
        <circle cx="44" cy="94" r="40" fill={P.cols[3]} opacity="0.22" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={12 + i * 36} y="96" width="26" height="12" rx="2" fill={P.cols[i]} opacity="0.95" />
        ))}
        {[34, 84, 128, 172].map((x, i) => (
          <g key={x} opacity="0.75">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse
                key={a}
                cx={x}
                cy={44 + i * 5}
                rx="5"
                ry="11"
                fill={P.cols[i % 3]}
                transform={`rotate(${a} ${x} ${44 + i * 5})`}
                opacity="0.6"
              />
            ))}
            <circle cx={x} cy={44 + i * 5} r="4" fill={P.cols[4]} />
          </g>
        ))}
      </svg>
      {children}
    </div>
  );
}
