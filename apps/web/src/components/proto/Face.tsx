import { useMemo } from "react";
import { rgba } from "../../theme/theme";
import type { Theme } from "../../theme/theme";
import { hash } from "./imagery";
import { Bust } from "./Bust";
import { EF_M, EF_F, EF_GROOM, EF_BRIDE, EF_COACH, GUEST_FACE, FACE_POS } from "./photoPools";

// Ported exactly from stitchd-v9.jsx lines 657-676.
export function Face({
  seed,
  name,
  T,
  size = 36,
  ring,
  tone,
  female,
}: {
  seed?: string;
  name?: string;
  T: Theme;
  size?: number;
  ring?: string;
  tone?: string;
  couple?: boolean;
  female?: boolean;
}) {
  const n = hash(seed || name || "p");
  const isF = female != null ? female : n % 2 === 0;
  const embed = useMemo(() => {
    if (seed === "junior") return EF_M[EF_GROOM];
    if (seed === "nadine") return EF_F[EF_BRIDE];
    if (seed === "coach") return EF_COACH;
    if (seed && GUEST_FACE[seed]) return GUEST_FACE[seed];
    const pool = isF ? EF_F : EF_M;
    return pool[n % pool.length];
  }, [n, isF, seed]);
  const t = tone || T.accent;
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, border: `2px solid ${ring || rgba(T.gold, 0.6)}`, background: rgba(t, 0.25) }}
    >
      <span className="absolute inset-0">
        <Bust T={T} tone={t} seed={seed || name} initials={size >= 30 ? initials : ""} />
      </span>
      <img
        src={embed}
        alt={name || ""}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: FACE_POS[embed] || "center" }}
      />
    </span>
  );
}
