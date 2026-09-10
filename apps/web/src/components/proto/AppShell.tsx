import { useEffect, useState, type ReactNode } from "react";
import { Heart, Palette, Sun, Moon, MessageCircle, Store, X, Check, LogOut, Search, ShieldCheck } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { supabase } from "../../lib/supabase";
import { PALETTES, PALETTE_ROLES } from "../../theme/palettes";
import { Chip } from "./Chip";
import { Face } from "./Face";
import { Logo } from "../Logo";
import { GlobalStyle } from "./GlobalStyle";
import { MoodTile } from "./MoodTile";
import { PaletteShot } from "./PaletteShot";
import { SupplierDrawer } from "./SupplierDrawer";
import { ReadinessDrawer } from "./ReadinessDrawer";
import { CoachBriefSheet } from "./CoachBriefSheet";
import { SearchModal } from "./SearchModal";
import { DAYS_LEFT, WEDDING } from "./data";
import { useProtoState } from "../../state/ProtoState";
import { TOP_TABS, SUBS_FOR, LUNGI_SUB, TAB_OF, firstScreenOf, type Screen } from "./nav";

// Alias kept so every existing lens component's `setLens: (l: LensKey) =>
// void` prop keeps typechecking unchanged against the new, broader
// Screen union — renaming every call site would be pure churn for no
// behavioural gain.
export type LensKey = Screen;

const SWATCH_USE = ["Primary blooms", "Secondary blooms", "Foliage & depth", "Linen & stationery", "Metallics & candlelight"];

export function AppShell({
  lens,
  setLens,
  children,
  isStaff = false,
}: {
  lens: LensKey;
  setLens: (l: LensKey) => void;
  children: ReactNode;
  // The Supplier Portal pill shows internal cross-supplier data (leads,
  // earnings, verify/feature controls for every business) — confidential,
  // so it's dropped entirely for anyone who isn't staff, not just
  // blocked-on-click. Defaults to hidden, the safe direction.
  isStaff?: boolean;
}) {
  const { mode, pal, T, setMode, setPal } = useTheme();
  const { gList, basket, toast, selSup, setSelSup, readyOpen, setReadyOpen, coachSel, setCoachSel } = useProtoState();
  const [palOpen, setPalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rsvpPend = gList.filter((g) => g.rsvp === "pending").length;
  const cartN = Object.keys(basket).length;
  const activeTab = TAB_OF[lens];
  const subTabs = lens === "portal" ? [] : activeTab === "lungi" ? [LUNGI_SUB] : activeTab ? SUBS_FOR[activeTab] : [];
  const activeTabLabel = activeTab === "lungi" ? "Ask Lungi" : TOP_TABS.find((t) => t.key === activeTab)?.label;

  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.ink, fontFamily: "'Manrope',system-ui,sans-serif" }}>
      <GlobalStyle T={T} />

      {/* HEADER */}
      <div
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{ background: rgba(mode === "dark" ? "#0A0A0E" : "#F3F1ED", 0.9), borderColor: T.border }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
          <Logo size={18} T={T} />
          <div className="hidden min-w-0 flex-1 overflow-x-auto lg:block">
            <div className="flex gap-1">
              {TOP_TABS.map(({ key, label, icon: I }) => (
                <button
                  key={key}
                  onClick={() => setLens(firstScreenOf(key))}
                  className="relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-semibold"
                  style={activeTab === key ? btnA : { color: T.sub, background: T.panel2 }}
                >
                  <I size={13} />
                  {label}
                  {key === "guests" && rsvpPend > 0 && (
                    <span className="rounded-full px-1.5 text-xs font-bold" style={{ background: activeTab === key ? T.onAccent : T.bad, color: activeTab === key ? T.accent : "#fff" }}>{rsvpPend}</span>
                  )}
                  {key === "stitchit" && cartN > 0 && (
                    <span className="rounded-full px-1.5 text-xs font-bold" style={{ background: activeTab === key ? T.onAccent : T.gold, color: activeTab === key ? T.accent : T.onGold }}>{cartN}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden sm:inline-flex">
              <Chip c={T.gold} T={T}>
                <Heart size={11} />
                {DAYS_LEFT} days
              </Chip>
            </span>
            <button aria-label="Palette and mood board" onClick={() => setPalOpen(true)} className="flex items-center gap-1.5 rounded-lg p-2" style={btnG}>
              <Palette size={16} />
              <span className="hidden h-3.5 w-10 overflow-hidden rounded-sm sm:flex">
                {PALETTES[pal].cols.map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </span>
            </button>
            <button aria-label="Theme" onClick={() => setMode(mode === "dark" ? "light" : "dark")} className="rounded-lg p-2" style={btnG}>
              {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {isStaff && (
              <>
                <a
                  href="/admin"
                  className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold sm:flex"
                  style={{ color: T.gold, background: rgba(T.gold, 0.12), border: `1px solid ${rgba(T.gold, 0.4)}` }}
                >
                  <ShieldCheck size={13} />Ops Console
                </a>
                <button
                  onClick={() => setLens("portal")}
                  className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold sm:flex"
                  style={lens === "portal" ? btnA : { color: T.gold, background: rgba(T.gold, 0.12), border: `1px solid ${rgba(T.gold, 0.4)}` }}
                >
                  <Store size={13} />Supplier Portal
                </button>
              </>
            )}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold md:flex"
              style={btnG}
            >
              <Search size={13} />Search <span style={{ color: T.faint }}>⌘K</span>
            </button>
            <button onClick={() => setLens("lungi")} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#1A1726", color: "#fff" }}>
              <MessageCircle size={13} />
              <span className="hidden sm:inline">Ask Lungi</span>
            </button>
            <div className="hidden items-center -space-x-2 sm:flex">
              <Face seed="junior" T={T} size={30} ring={T.bg} />
              <Face seed="nadine" T={T} size={30} ring={T.bg} />
            </div>
            <button aria-label="Sign out" onClick={() => supabase.auth.signOut()} className="rounded-lg p-2" style={btnG}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="relative mx-auto max-w-[1400px] lg:hidden">
          <div
            className="pointer-events-none absolute bottom-2 right-0 top-0 w-8"
            style={{ background: `linear-gradient(90deg, transparent, ${mode === "dark" ? "#0A0A0E" : "#F3F1ED"})` }}
          />
          <div className="overflow-x-auto px-4 pb-2">
            <div className="flex gap-1">
              {TOP_TABS.map(({ key, label, icon: I }) => (
                <button
                  key={key}
                  onClick={() => setLens(firstScreenOf(key))}
                  className="relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-semibold"
                  style={activeTab === key ? btnA : { color: T.sub, background: T.panel2 }}
                >
                  <I size={13} />
                  {label}
                  {key === "guests" && rsvpPend > 0 && (
                    <span className="rounded-full px-1.5 text-xs font-bold" style={{ background: activeTab === key ? T.onAccent : T.bad, color: activeTab === key ? T.accent : "#fff" }}>{rsvpPend}</span>
                  )}
                  {key === "stitchit" && cartN > 0 && (
                    <span className="rounded-full px-1.5 text-xs font-bold" style={{ background: activeTab === key ? T.onAccent : T.gold, color: activeTab === key ? T.accent : T.onGold }}>{cartN}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        {subTabs.length > 0 && (
          <div className="relative mx-auto max-w-[1400px] border-t" style={{ borderColor: T.border }}>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-xs" style={{ color: T.faint }}>
                  {WEDDING.couple} · {WEDDING.dateLabel} · {WEDDING.venue}
                </div>
                <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 18, color: T.ink }}>{activeTabLabel}</div>
              </div>
              {/* A lone sub-tab is nothing to pick between — hide the pill
                  row and let the title stand alone (e.g. "Suppliers" now
                  that "Find someone" is gone, it's just "Your circle"). */}
              {subTabs.length > 1 && (
                <div className="flex gap-1">
                  {subTabs.map(({ key, label, icon: I }) => (
                    <button
                      key={key}
                      onClick={() => setLens(key)}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={lens === key ? { color: T.accent, background: rgba(T.accent, 0.12) } : { color: T.faint }}
                    >
                      <I size={12} />
                      {label}
                      {key === "rsvp" && rsvpPend > 0 && (
                        <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: T.bad, color: "#fff" }}>{rsvpPend}</span>
                      )}
                      {key === "stitchit" && cartN > 0 && (
                        <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: T.gold, color: T.onGold }}>{cartN}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-4">{children}</div>

      <div className="border-t px-4 py-4 text-center text-xs" style={{ borderColor: T.border, color: T.faint }}>
        <span style={{ fontFamily: "'Archivo Black',sans-serif", color: T.sub }}>
          STITCH<span className="mx-0.5 inline-block h-1 w-3 rounded-sm align-middle" style={{ background: T.accent }} />D
        </span>{" "}
        · Events, stitched together — Demo environment. Venue and supplier names reference real Gauteng businesses; all ratings, prices, metrics, contact numbers, hire quotes and people are simulated. Photography via Unsplash / randomuser.
      </div>

      {lens !== "lungi" && (
        <button
          aria-label="Ask Lungi"
          onClick={() => setLens("lungi")}
          className="press fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: T.accent, color: T.onAccent, boxShadow: "0 12px 28px -8px rgba(0,0,0,0.4)" }}
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* ===== PALETTE STUDIO ===== */}
      {palOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0" style={{ background: "rgba(5,5,10,0.7)" }} onClick={() => setPalOpen(false)} />
          <div className="rise relative w-full max-w-lg rounded-t-3xl border p-5 sm:rounded-3xl" style={{ background: T.panel, borderColor: T.border, maxHeight: "88vh", overflowY: "auto" }}>
            <div className="mb-3 flex items-center gap-2">
              <Palette size={16} style={{ color: T.gold }} />
              <div className="min-w-0 flex-1">
                <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 16 }}>PALETTE STUDIO</div>
                <div className="text-xs" style={{ color: T.sub }}>Re-skins the app and rewrites your florist's brief.</div>
              </div>
              <button aria-label="Close" onClick={() => setPalOpen(false)} className="rounded-lg p-1.5" style={btnG}><X size={15} /></button>
            </div>
            <MoodTile T={T} pal={pal} h={128}>
              <div className="absolute bottom-2 left-2 rounded-lg px-2 py-1" style={{ background: "rgba(5,5,10,0.62)", color: "#fff", fontSize: 12, fontWeight: 800 }}>{PALETTES[pal].name}</div>
            </MoodTile>
            <div className="mt-2 space-y-1">
              {PALETTES[pal].cols.map((c, i) => (
                <div key={c} className="flex items-center gap-2">
                  <span className="h-6 w-12 shrink-0 rounded" style={{ background: c, border: `1px solid ${T.border}` }} />
                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: T.sub }}>{SWATCH_USE[i]}</span>
                  <span style={{ fontSize: 10, color: T.faint, fontFamily: "ui-monospace,monospace" }}>{c}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PALETTES.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => { setPal(i); toast(`${p.name} applied · ${Object.keys(PALETTE_ROLES).length} supplier briefs updated`); }}
                  className="press overflow-hidden rounded-xl border text-left"
                  style={{ borderColor: pal === i ? T.accent : T.border, borderWidth: pal === i ? 2 : 1, background: T.panel2 }}
                >
                  <div className="relative">
                    <PaletteShot pid={p.img} pal={i} T={T} h={72} />
                    {pal === i && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: T.accent }}><Check size={11} style={{ color: T.onAccent }} /></span>}
                  </div>
                  <div className="flex h-4">{p.cols.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
                  <div className="px-1.5 py-1"><span className="block truncate" style={{ fontSize: 9.5, fontWeight: 700, color: T.ink }}>{p.name}</span></div>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl p-3 text-xs" style={{ background: rgba(T.gold, 0.1), color: T.gold }}>
              <b>Where this lands:</b> {Object.entries(PALETTE_ROLES).map(([r, job]) => `${r} (${job})`).join(", ")} — each card shows the strip and each drawer carries the swatch brief.
            </div>
            <button onClick={() => { setPalOpen(false); setLens("team"); }} className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold" style={btnA}>See it on your circle</button>
          </div>
        </div>
      )}

      {selSup && <SupplierDrawer id={selSup} onClose={() => setSelSup(null)} onOpenPalette={() => setPalOpen(true)} />}
      {readyOpen && <ReadinessDrawer onClose={() => setReadyOpen(false)} setLens={setLens} />}
      {coachSel && <CoachBriefSheet id={coachSel} onClose={() => setCoachSel(null)} />}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} setLens={setLens} />
    </div>
  );
}
