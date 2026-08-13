import { PALETTES } from "../../theme/palettes";
import type { Theme } from "../../theme/theme";
import { hash } from "./imagery";

// Ported exactly from stitchd-v9.jsx lines 536-654 — procedural category
// scene illustration, one hand-drawn SVG per supplier role.
export function Scene({ role, seed, pal }: { role: string; seed?: string; T: Theme; pal: number }) {
  const P = PALETTES[pal] || PALETTES[2];
  const n = hash(seed || role || "s");
  const sky = P.cols[2];
  const mid = P.cols[0];
  const lite = P.cols[1];
  const warm = P.cols[4];
  const ink = "rgba(8,8,14,0.72)";
  const g = `sc${n % 9999}`;

  return (
    <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lite} />
          <stop offset="62%" stopColor={mid} />
          <stop offset="100%" stopColor={sky} />
        </linearGradient>
      </defs>
      <rect width="200" height="150" fill={`url(#${g})`} />
      <circle cx={44 + (n % 5) * 24} cy="34" r="15" fill={warm} opacity="0.5" />

      {role === "Venue" && (
        <g fill={ink}>
          <rect y="112" width="200" height="38" />
          <path d="M40,112 L40,74 L100,48 L160,74 L160,112 Z" />
          <rect x="92" y="88" width="16" height="24" fill={warm} opacity="0.85" />
          {[58, 74, 126, 142].map((x) => (
            <rect key={x} x={x} y="82" width="9" height="11" fill={warm} opacity="0.6" />
          ))}
          <path d="M36,74 L100,44 L164,74 L164,79 L100,50 L36,79 Z" />
        </g>
      )}

      {role === "Flower Specialist" && (
        <g>
          <rect y="126" width="200" height="24" fill={ink} />
          {[38, 76, 118, 160].map((x, i) => (
            <g key={x}>
              <path d={`M${x},126 Q${x - 5},104 ${x},88`} stroke={ink} strokeWidth="2.5" fill="none" />
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse
                  key={a}
                  cx={x}
                  cy="82"
                  rx="4.5"
                  ry="9"
                  fill={P.cols[i % 3]}
                  opacity="0.95"
                  transform={`rotate(${a + (n % 30)} ${x} 82)`}
                />
              ))}
              <circle cx={x} cy="82" r="3.5" fill={warm} />
            </g>
          ))}
        </g>
      )}

      {role === "Catering" && (
        <g fill={ink}>
          <rect y="118" width="200" height="32" />
          <rect x="24" y="112" width="152" height="7" />
          <path d="M56,112 A26,22 0 0 1 108,112 Z" />
          <rect x="78" y="86" width="8" height="6" />
          <circle cx="82" cy="83" r="4" fill={warm} />
          <g stroke={ink} strokeWidth="3" fill="none">
            <path d="M132,86 L132,112" />
            <path d="M126,86 L126,96 M138,86 L138,96" />
          </g>
          <ellipse cx="158" cy="108" rx="14" ry="4" />
        </g>
      )}

      {role === "Photography" && (
        <g fill={ink}>
          <rect y="122" width="200" height="28" />
          <rect x="62" y="72" width="76" height="50" rx="7" />
          <rect x="84" y="64" width="30" height="10" rx="3" />
          <circle cx="100" cy="97" r="19" fill={sky} opacity="0.9" />
          <circle cx="100" cy="97" r="12" fill={ink} />
          <circle cx="94" cy="91" r="4" fill={warm} opacity="0.9" />
          <rect x="122" y="79" width="8" height="5" fill={warm} />
        </g>
      )}

      {(role === "Entertainment" || role === "MC") && (
        <g fill={ink}>
          <rect y="124" width="200" height="26" />
          {[52, 100, 148].map((x, i) => (
            <g key={x}>
              <rect x={x - 3} y={70 + i * 6} width="6" height={54 - i * 6} />
              <circle cx={x} cy={68 + i * 6} r="11" />
              <circle cx={x} cy={68 + i * 6} r="4" fill={warm} />
            </g>
          ))}
          <path d="M0,124 L200,124" stroke={warm} strokeWidth="2" opacity="0.5" />
        </g>
      )}

      {role === "Cake" && (
        <g fill={ink}>
          <rect y="126" width="200" height="24" />
          <rect x="66" y="98" width="68" height="28" rx="3" />
          <rect x="78" y="76" width="44" height="22" rx="3" />
          <rect x="88" y="58" width="24" height="18" rx="3" />
          {[74, 90, 106, 122].map((x) => (
            <circle key={x} cx={x} cy="98" r="3" fill={P.cols[0]} />
          ))}
          <rect x="99" y="48" width="2" height="10" fill={warm} />
          <circle cx="100" cy="46" r="3" fill={warm} />
        </g>
      )}

      {role === "Transport" && (
        <g fill={ink}>
          <rect y="120" width="200" height="30" />
          <path d="M34,116 L34,96 L58,96 L74,80 L128,80 L142,96 L166,96 L166,116 Z" />
          <rect x="80" y="84" width="20" height="12" fill={sky} opacity="0.85" />
          <rect x="106" y="84" width="20" height="12" fill={sky} opacity="0.85" />
          <circle cx="62" cy="116" r="11" />
          <circle cx="62" cy="116" r="4" fill={warm} />
          <circle cx="140" cy="116" r="11" />
          <circle cx="140" cy="116" r="4" fill={warm} />
        </g>
      )}

      {(role === "Décor Supplier" || role === "Tent & Weather" || role === "Tailor") && (
        <g fill={ink}>
          <rect y="124" width="200" height="26" />
          <path d="M22,124 L100,52 L178,124 Z" />
          <path d="M100,52 L100,124" stroke={warm} strokeWidth="2" opacity="0.55" />
          <path d="M62,124 Q100,96 138,124 Z" fill={sky} opacity="0.65" />
          {[46, 100, 154].map((x) => (
            <circle key={x} cx={x} cy="70" r="3" fill={warm} opacity="0.8" />
          ))}
        </g>
      )}

      {role === "Videography" && (
        <g fill={ink}>
          <rect y="124" width="200" height="26" />
          <rect x="56" y="80" width="66" height="42" rx="5" />
          <path d="M122,94 L152,80 L152,122 L122,108 Z" />
          <circle cx="76" cy="92" r="7" fill={sky} opacity="0.9" />
          <circle cx="100" cy="92" r="7" fill={sky} opacity="0.9" />
          <rect x="62" y="110" width="34" height="4" fill={warm} opacity="0.7" />
        </g>
      )}

      {role === "Hair & Makeup" && (
        <g fill={ink}>
          <rect y="126" width="200" height="24" />
          <circle cx="100" cy="80" r="26" />
          <path
            d="M74,80 Q74,44 100,44 Q126,44 126,80 Q126,60 100,58 Q74,60 74,80 Z"
            fill={P.cols[0]}
          />
          <circle cx="90" cy="82" r="3" fill={sky} />
          <circle cx="110" cy="82" r="3" fill={sky} />
          <path d="M92,94 Q100,100 108,94" stroke={warm} strokeWidth="2.5" fill="none" />
        </g>
      )}

      {role === "Planner" && (
        <g fill={ink}>
          <rect y="126" width="200" height="24" />
          <rect x="62" y="58" width="76" height="68" rx="5" />
          {[72, 84, 96, 108].map((y) => (
            <rect key={y} x="74" y={y} width="52" height="4" rx="2" fill={sky} opacity="0.8" />
          ))}
          <circle cx="126" cy="116" r="9" fill={warm} />
          <path d="M122,116 l3,3 l6,-7" stroke={ink} strokeWidth="2.5" fill="none" />
        </g>
      )}
    </svg>
  );
}
