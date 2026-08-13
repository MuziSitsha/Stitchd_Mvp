import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { buildTheme, type Mode, type Theme } from "./theme";

interface ThemeCtx {
  mode: Mode;
  pal: number;
  T: Theme;
  setMode: (m: Mode) => void;
  setPal: (p: number) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("dark");
  const [pal, setPal] = useState(2); // Midnight Violet — the prototype's default
  const T = useMemo(() => buildTheme(mode, pal), [mode, pal]);

  return <Ctx.Provider value={{ mode, pal, T, setMode, setPal }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
