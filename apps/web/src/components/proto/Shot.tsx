import { useMemo, type ReactNode } from "react";
import type { Theme } from "../../theme/theme";
import { hash } from "./imagery";
import { Scene } from "./Scene";
import { ES_POOL, CATEGORY_PHOTO } from "./photoPools";

// Ported originally from stitchd-v9.jsx lines 679-693. Photo resolution is a
// deterministic category/role lookup (CATEGORY_PHOTO) rather than a hash
// into a small shared pool, so two different businesses never land on the
// same photo by coincidence — see photoPools.ts for the full rationale.
export function Shot({
  role,
  seed,
  T,
  pal,
  h = 120,
  radius = 0,
  children,
  cat,
}: {
  role?: string;
  seed?: string;
  T: Theme;
  pal: number;
  h?: number;
  radius?: number;
  children?: ReactNode;
  cat?: string;
}) {
  const src = useMemo(() => {
    const key = cat ?? role;
    if (key != null && CATEGORY_PHOTO[key] != null) return ES_POOL[CATEGORY_PHOTO[key]];
    return ES_POOL[hash(seed || role || cat || "x") % ES_POOL.length];
  }, [cat, role, seed]);

  return (
    <div className="relative overflow-hidden" style={{ height: h, borderRadius: radius }}>
      <div className="absolute inset-0">
        <Scene role={role || ""} seed={seed} T={T} pal={pal} />
      </div>
      <img
        src={src}
        alt={role || cat || ""}
        className="photo-grade"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {children}
    </div>
  );
}
