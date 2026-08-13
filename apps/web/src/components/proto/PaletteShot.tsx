import { PALETTES } from "../../theme/palettes";
import { rgba } from "../../theme/theme";
import type { Theme } from "../../theme/theme";
import { ES_POOL, ES_PAL } from "./photoPools";
import { MoodTile } from "./MoodTile";

// Ported exactly from stitchd-v9.jsx lines 987-998 — a real wedding photo
// tinted to the palette, mood tile beneath. Used by the onboarding wizard's
// palette-picker grid.
export function PaletteShot({ pid, pal, T, h = 72 }: { pid: string; pal: number; T: Theme; h?: number }) {
  const P = PALETTES[pal];
  const src = ES_POOL[ES_PAL[pal % ES_PAL.length]];
  return (
    <div className="relative overflow-hidden" style={{ height: h }}>
      <div className="absolute inset-0"><MoodTile T={T} pal={pal} h={h} /></div>
      <img src={src} alt={pid} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${rgba(P.cols[2], 0.28)} 0%, transparent 35%, ${rgba(P.cols[2], 0.6)})`, mixBlendMode: "multiply" }} />
    </div>
  );
}
