import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun, ArrowLeft } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba, type Theme } from "../theme/theme";
import { supabase } from "../lib/supabase";
import { Logo } from "./Logo";
import { GlobalStyle } from "./proto/GlobalStyle";

// Shared shell for /supplier and /admin — same visual language as the client
// app's AppShell (sticky header, breadcrumb+title row, content container,
// footer wordmark, GlobalStyle's hover/press/focus treatment) so neither
// surface reads as a different, more basic product bolted onto the same
// app. Navigation differs by role (this takes `right` for role-specific
// actions instead of a shared tab set), the *feel* doesn't.
export function PortalShell({
  eyebrow,
  title,
  right,
  backTo,
  children,
  signOutTo = "/",
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
  backTo?: { href: string; label: string };
  children: ReactNode;
  // Where to land after signing out — /supplier/login, /admin/login, or
  // wherever else makes sense for whoever's using this shell. Defaults to
  // the front door.
  signOutTo?: string;
}) {
  const { mode, T, setMode } = useTheme();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };

  // supabase.auth.signOut() alone doesn't move anyone anywhere — none of
  // this shell's pages re-check auth reactively (each does its own
  // one-time getUser() on mount), so without an explicit redirect here the
  // button visibly did nothing: the session was gone but the same stale
  // page just sat there. Navigate first (so the click always feels
  // instant), sign out after.
  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    navigate(signOutTo, { replace: true });
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.ink, fontFamily: "'Manrope',system-ui,sans-serif" }}>
      <GlobalStyle T={T} />
      <div
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ background: rgba(mode === "dark" ? "#0A0A0E" : "#F3F1ED", 0.9), borderColor: T.border }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <Logo size={18} T={T} />
          {backTo && (
            <a href={backTo.href} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={btnG}>
              <ArrowLeft size={13} />{backTo.label}
            </a>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button aria-label="Theme" onClick={() => setMode(mode === "dark" ? "light" : "dark")} className="rounded-lg p-2" style={btnG}>
              {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {right}
            <button aria-label="Sign out" onClick={handleSignOut} disabled={signingOut} className="rounded-lg p-2 disabled:opacity-60" style={btnG}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-[1400px] px-4 pb-3">
          {eyebrow && <div className="truncate text-xs" style={{ color: T.faint }}>{eyebrow}</div>}
          <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 18, color: T.ink }}>{title}</div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] space-y-3 px-4 py-4">{children}</div>

      <div className="border-t px-4 py-4 text-center text-xs" style={{ borderColor: T.border, color: T.faint }}>
        <span style={{ fontFamily: "'Archivo Black',sans-serif", color: T.sub }}>
          STITCH<span className="mx-0.5 inline-block h-1 w-3 rounded-sm align-middle" style={{ background: T.accent }} />D
        </span>{" "}
        · Events, stitched together
      </div>
    </div>
  );
}

// Small shared building blocks so every section in both portals reads as
// one system instead of each page inventing its own card/stat/badge markup.
export function PortalCard({ T, children, style, className }: { T: Theme; children: ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${className ?? ""}`} style={{ background: T.panel, borderColor: T.border, boxShadow: T.shadow, ...style }}>
      {children}
    </div>
  );
}

export function StatTile({ T, value, label, color }: { T: Theme; value: ReactNode; label: string; color?: string }) {
  return (
    <div className="min-w-0 rounded-xl p-3 text-center" style={{ background: T.panel2 }}>
      <div className="tnum truncate" style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 22, lineHeight: 1, color: color ?? T.ink }}>{value}</div>
      <div className="mt-1 text-xs" style={{ color: T.sub }}>{label}</div>
    </div>
  );
}

export function StatusChip({ T, tone, children }: { T: Theme; tone: "good" | "warn" | "bad" | "accent" | "faint"; children: ReactNode }) {
  const c = { good: T.good, warn: T.warn, bad: T.bad, accent: T.accent, faint: T.faint }[tone];
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: rgba(c, 0.14), color: c }}>
      {children}
    </span>
  );
}
