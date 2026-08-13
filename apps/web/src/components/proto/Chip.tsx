import type { ReactNode } from "react";
import { rgba } from "../../theme/theme";
import type { Theme } from "../../theme/theme";

// Ported exactly from stitchd-v9.jsx lines 456-461.
export function Chip({ c, T, children }: { c: string; T: Theme; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold"
      style={{ background: rgba(c, T.mode === "dark" ? 0.18 : 0.12), color: c, border: `1px solid ${rgba(c, 0.4)}` }}
    >
      {children}
    </span>
  );
}
