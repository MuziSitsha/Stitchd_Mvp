import type { Theme } from "../theme/theme";

// Ported exactly from stitchd-v9.jsx's Logo() — the gold piece is a sized
// rectangle bar, not a dash character, hence the specific width/height math.
// T is optional: prototype-side callers (AppShell, Onboarding) pass the live
// theme so the wordmark reacts to mode/palette changes; the real Supplier
// Portal's Header doesn't have a theme system, so it falls back to the
// static CSS vars in index.css.
export function Logo({ size = 22, T }: { size?: number; T?: Theme }) {
  const ink = T ? T.ink : "var(--ink)";
  const gold = T ? T.gold : "var(--gold)";
  const faint = T ? T.faint : "var(--faint)";
  return (
    <div className="select-none leading-none">
      <div
        className="flex items-center"
        style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: size, letterSpacing: 1, color: ink }}
      >
        STITCH
        <span
          className="mx-1 inline-block rounded-sm"
          style={{ width: size * 0.72, height: size * 0.24, background: gold }}
        />
        D
      </div>
      <div
        style={{
          fontSize: size * 0.32,
          letterSpacing: size * 0.13,
          color: faint,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        EVENTS, STITCHED TOGETHER
      </div>
    </div>
  );
}
