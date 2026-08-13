import { rgba } from "../../theme/theme";
import type { Theme } from "../../theme/theme";
import { hash, SKIN, HAIR } from "./imagery";

// Ported exactly from stitchd-v9.jsx lines 500-533 — deterministic
// procedural-SVG portrait silhouette, keyed by seed, so it always renders
// something designed instead of a blank box.
export function Bust({
  tone,
  initials,
  seed = "x",
}: {
  T: Theme;
  tone: string;
  initials?: string;
  seed?: string;
}) {
  const n = hash(seed + (initials || ""));
  const skin = SKIN[n % SKIN.length];
  const hair = HAIR[(n >> 3) % HAIR.length];
  const style = n % 4; // hair silhouette variant
  const g = `bs${n % 99999}`;

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={rgba(tone, 0.5)} />
          <stop offset="100%" stopColor={rgba(tone, 0.16)} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${g})`} />
      {/* shoulders */}
      <path d="M12,100 C12,74 30,66 50,66 C70,66 88,74 88,100 Z" fill={rgba("#0A0A0E", 0.42)} />
      <path d="M20,100 C20,80 33,73 50,73 C67,73 80,80 80,100 Z" fill={skin} opacity="0.9" />
      {/* neck + head */}
      <rect x="43" y="55" width="14" height="16" rx="6" fill={skin} />
      <ellipse cx="50" cy="41" rx="16" ry="18" fill={skin} />
      {/* hair variants */}
      {style === 0 && <path d="M33,42 C31,22 69,22 67,42 C67,33 62,27 50,27 C38,27 33,33 33,42 Z" fill={hair} />}
      {style === 1 && (
        <path
          d="M32,44 C30,20 70,20 68,44 C66,30 60,25 50,25 C40,25 34,30 34,40 L34,52 C30,50 31,46 32,44 Z"
          fill={hair}
        />
      )}
      {style === 2 && (
        <g fill={hair}>
          <ellipse cx="50" cy="30" rx="18" ry="12" />
          <circle cx="35" cy="40" r="5" />
          <circle cx="65" cy="40" r="5" />
        </g>
      )}
      {style === 3 && <path d="M34,40 C34,26 66,26 66,40 C66,34 60,29 50,29 C40,29 34,34 34,40 Z" fill={hair} />}
      {/* soft features */}
      <circle cx="44" cy="42" r="1.4" fill={rgba("#0A0A0E", 0.55)} />
      <circle cx="56" cy="42" r="1.4" fill={rgba("#0A0A0E", 0.55)} />
      <path d="M46,49 Q50,52 54,49" stroke={rgba("#0A0A0E", 0.4)} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {initials && (
        <text
          x="50"
          y="97"
          textAnchor="middle"
          fill={rgba("#FFFFFF", 0.92)}
          style={{ font: "700 11px 'Archivo Black',sans-serif", letterSpacing: 1 }}
        >
          {initials}
        </text>
      )}
    </svg>
  );
}
