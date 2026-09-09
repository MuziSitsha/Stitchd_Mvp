import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, type LucideIcon } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { supabase } from "../lib/supabase";
import { GlobalStyle } from "./proto/GlobalStyle";

export interface AdminNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

// Deliberately not theme-toggled — a fixed dark ops chrome (same idea as
// Vercel/Linear/Stripe's own consoles) so this reads as a genuinely
// different surface from the client/supplier apps' cream-and-purple
// branding, regardless of which theme the viewer has picked for those.
const SIDEBAR_BG = "#14131C";
const SIDEBAR_BORDER = "rgba(255,255,255,0.08)";

// Real ops-console frame — sidebar navigation + a plain content area,
// replacing the client/supplier apps' shared PortalShell (sticky branded
// header, hero cards, one continuous scroll). Every existing AdminConsole
// query/handler is untouched; this only changes how its ~15 sections are
// framed and navigated between.
export function AdminShell({
  nav, active, onNavigate, title, children,
}: {
  nav: AdminNavItem[];
  active: string;
  onNavigate: (key: string) => void;
  title: string;
  children: ReactNode;
}) {
  const { mode, T, setMode } = useTheme();
  const navigate = useNavigate();

  async function handleSignOut() {
    navigate("/", { replace: true });
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen md:flex" style={{ background: T.bg, color: T.ink, fontFamily: "'Manrope',system-ui,sans-serif" }}>
      <GlobalStyle T={T} />

      {/* SIDEBAR — desktop only */}
      <div className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r px-3 py-4 md:flex" style={{ background: SIDEBAR_BG, borderColor: SIDEBAR_BORDER }}>
        <div className="px-2 pb-4">
          <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 15, color: "#fff", letterSpacing: 0.5 }}>STITCH<span className="mx-0.5 inline-block h-1 w-3 rounded-sm align-middle" style={{ background: T.accent }} />D</div>
          <div className="mt-0.5 text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: 1.5 }}>OPS CONSOLE</div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {nav.map(({ key, label, icon: I, badge }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="press flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold"
              style={active === key ? { background: "rgba(255,255,255,0.1)", color: "#fff" } : { background: "transparent", color: "rgba(255,255,255,0.55)" }}
            >
              <I size={14} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {!!badge && <span className="shrink-0 rounded-full px-1.5 text-[10px] font-bold" style={{ background: "#E15252", color: "#fff" }}>{badge}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-3 flex items-center gap-1 border-t px-1 pt-3" style={{ borderColor: SIDEBAR_BORDER }}>
          <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} className="press rounded-lg p-2" style={{ color: "rgba(255,255,255,0.55)" }} aria-label="Theme">
            {mode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={handleSignOut} className="press flex flex-1 items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
            <LogOut size={13} />Sign out
          </button>
        </div>
      </div>

      {/* MOBILE TOP BAR + horizontal nav strip */}
      <div className="sticky top-0 z-30 border-b md:hidden" style={{ background: SIDEBAR_BG, borderColor: SIDEBAR_BORDER }}>
        <div className="flex items-center justify-between px-4 py-2.5">
          <div>
            <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 14, color: "#fff" }}>STITCH<span className="mx-0.5 inline-block h-1 w-3 rounded-sm align-middle" style={{ background: T.accent }} />D</div>
            <div className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: 1.5 }}>OPS CONSOLE</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} className="press rounded-lg p-2" style={{ color: "rgba(255,255,255,0.55)" }} aria-label="Theme">
              {mode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={handleSignOut} className="press rounded-lg p-2" style={{ color: "rgba(255,255,255,0.55)" }} aria-label="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 pb-2.5">
          {nav.map(({ key, label, icon: I, badge }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="press flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={active === key ? { background: "rgba(255,255,255,0.14)", color: "#fff" } : { background: "transparent", color: "rgba(255,255,255,0.5)" }}
            >
              <I size={12} />{label}
              {!!badge && <span className="rounded-full px-1.5 text-[9px] font-bold" style={{ background: "#E15252", color: "#fff" }}>{badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 20 }}>{title}</div>
          </div>
          <div className="space-y-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Denser building block for the console's own list/table sections —
// square corners, thin border, no shadow, no rounded-2xl "product card"
// treatment — so this reads as a real ops tool rather than the client/
// supplier apps reused verbatim.
export function AdminPanel({ T, title, subtitle, right, children }: { T: import("../theme/theme").Theme; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border" style={{ background: T.panel, borderColor: T.border }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: T.border }}>
        <div>
          <div className="text-xs font-bold" style={{ letterSpacing: 0.3 }}>{title}</div>
          {subtitle && <div className="mt-0.5 text-[11px]" style={{ color: T.faint }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function kpiTone(T: import("../theme/theme").Theme, level: "good" | "warn" | "bad" | "neutral") {
  return { good: T.good, warn: T.warn, bad: T.bad, neutral: T.sub }[level];
}

// KPI tile for Overview — plainer than the client/supplier StatTile (no
// rounded-xl panel-on-panel), clickable to jump straight to the section
// that explains the number.
export function KpiTile({ T, value, label, tone = "neutral", onClick }: { T: import("../theme/theme").Theme; value: ReactNode; label: string; tone?: "good" | "warn" | "bad" | "neutral"; onClick?: () => void }) {
  const color = kpiTone(T, tone);
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="press min-w-0 rounded-lg border p-3.5 text-left disabled:cursor-default"
      style={{ background: T.panel, borderColor: tone === "bad" ? rgba(T.bad, 0.35) : T.border }}
    >
      <div className="tnum truncate" style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 24, lineHeight: 1, color }}>{value}</div>
      <div className="mt-1 text-[11px] font-semibold" style={{ color: T.sub }}>{label}</div>
    </button>
  );
}
