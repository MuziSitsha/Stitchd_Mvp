import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import type { Theme } from "../../theme/theme";

// Ported exactly from stitchd-v9.jsx lines 462-465.
export function Card({
  T,
  children,
  className = "",
  style = {},
  onClick,
}: {
  T: Theme;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-2.5 ${onClick ? "lift press" : ""} ${className}`}
      style={{ background: T.panel, borderColor: T.border, boxShadow: T.shadow, ...style }}
    >
      {children}
    </div>
  );
}
