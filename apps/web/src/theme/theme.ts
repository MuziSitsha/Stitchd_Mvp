// Ported exactly from stitchd-v9.jsx lines 19-62 — same math, same output.
import { PALETTES } from "./palettes";

export type Mode = "dark" | "light";

export interface Theme {
  mode: Mode;
  bg: string;
  bgTint: string;
  panel: string;
  panel2: string;
  border: string;
  ink: string;
  sub: string;
  faint: string;
  accent: string;
  gold: string;
  onAccent: string;
  onGold: string;
  good: string;
  warn: string;
  bad: string;
  info: string;
  grid: string;
  tipBg: string;
  shadow: string;
}

export const rgba = (hex: string, a: number): string => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const lum = (hex: string): number => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(((n >> 16) & 255) / 255) + 0.7152 * f(((n >> 8) & 255) / 255) + 0.0722 * f((n & 255) / 255);
};

export const inkOn = (hex: string): string => (lum(hex) > 0.42 ? "#14121C" : "#FFFFFF");

export function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((x, i) => Math.round(x + (pb[i] - x) * t));
  return "#" + c.map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function buildTheme(mode: Mode, palIdx = 2): Theme {
  const P = PALETTES[palIdx] || PALETTES[2];
  const accent = mode === "dark" ? P.a : P.al;
  const gold = mode === "dark" ? P.g : P.gl;
  const deep = P.cols[2]; // the palette's darkest tone drives the background wash

  if (mode === "dark") {
    return {
      mode,
      bg: mix("#0A0A0E", deep, 0.14),
      bgTint: rgba(deep, 0.5),
      panel: mix("#131319", deep, 0.1),
      panel2: mix("#1A1A23", deep, 0.12),
      border: rgba(accent, 0.14),
      ink: "#F2F0EC",
      sub: "#9C99AB",
      faint: "#5E5B6E",
      accent,
      gold,
      onAccent: inkOn(accent),
      onGold: inkOn(gold),
      good: "#3DD68C",
      warn: "#E9B84C",
      bad: "#F0644C",
      info: "#5FA8F5",
      grid: "rgba(255,255,255,0.06)",
      tipBg: mix("#1A1A23", deep, 0.12),
      shadow: "0 12px 34px rgba(0,0,0,0.5)",
    };
  }

  return {
    mode,
    bg: mix("#F3F1ED", P.cols[3], 0.5),
    bgTint: rgba(P.cols[0], 0.4),
    panel: mix("#FCFBF8", P.cols[3], 0.25),
    panel2: mix("#ECEAE4", P.cols[0], 0.12),
    border: rgba(accent, 0.16),
    ink: "#171522",
    sub: "#5D5A6E",
    faint: "#96939F",
    accent,
    gold,
    onAccent: inkOn(accent),
    onGold: inkOn(gold),
    good: "#178A57",
    warn: "#A97614",
    bad: "#C24B33",
    info: "#2A6BB0",
    grid: "rgba(20,18,30,0.07)",
    tipBg: mix("#FCFBF8", P.cols[3], 0.25),
    shadow: "0 10px 26px rgba(20,18,30,0.10)",
  };
}
