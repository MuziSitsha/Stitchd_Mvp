import { useState, type ReactNode } from "react";
import { Heart, Flower2, CheckCircle2, ChevronLeft, Sparkles, Check, ArrowRight, Zap } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { rgba } from "../../theme/theme";
import { PALETTES } from "../../theme/palettes";
import { rolesFor, weightsFor } from "./readiness";
import { WEDDING, fmtR } from "./data";
import { Logo } from "../Logo";
import { MoodTile } from "./MoodTile";
import { PaletteShot } from "./PaletteShot";
import type { Profile, OnboardingResult } from "../../state/ProtoState";

const ONB_TYPES: [string, typeof Heart][] = [["Wedding", Heart], ["Funeral", Flower2]];
const ONB_PRIOR = ["Budget", "Food & Catering", "Guest Experience", "Venue", "Photography", "Music & Entertainment", "Décor & Flowers", "Traditions & Customs", "Punctuality & Timing", "Sustainability"];
const TITLES = ["Choose event type", "Event details", "Style & mood", "Your priorities", "Preferences", "You're all set \u{1F389}"];
const SUBS = ["Tell us what you're planning so we can guide you.", "Guest count sizes your core squad.", "Your palette re-skins the whole board, not just a mood card.", "Up to 5. These reorder your suppliers and reweight your readiness score.", "Budget sets your live cap. Channel decides how reminders go out.", "Here's exactly what each answer changed."];

function Effect({ T, children }: { T: Theme; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl p-2.5 text-xs" style={{ background: rgba(T.gold, 0.1), color: T.gold }}>
      <Zap size={13} className="mt-0.5 shrink-0" /><span style={{ lineHeight: 1.45 }}>{children}</span>
    </div>
  );
}

// Ported exactly from stitchd-v9.jsx lines 853-951.
export function Onboarding({
  T, guests, setGuests, pal, setPal, initial, onDone,
}: {
  T: Theme;
  guests: number;
  setGuests: (n: number) => void;
  pal: number;
  setPal: (n: number) => void;
  initial: Profile;
  onDone: (p: OnboardingResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [etype, setEtype] = useState(initial.etype || "Wedding");
  const [prior, setPrior] = useState(new Set(initial.prior.size ? initial.prior : ["Food & Catering", "Music & Entertainment", "Décor & Flowers"]));
  const [supp, setSupp] = useState(initial.supp || "Full planning support");
  const [comm, setComm] = useState<"WhatsApp" | "Email" | "Call">(initial.comm || "WhatsApp");
  const [budget, setBudget] = useState(initial.budget || 400);
  const coreN = guests < 80 ? 5 : guests <= 150 ? 6 : guests <= 250 ? 8 : 10;
  const pRoles = rolesFor(prior);
  const { why } = weightsFor(prior);
  const finish = () => onDone({ etype, prior: [...prior], supp, comm, budget, pal, guests });
  const btnA = { background: T.accent, color: T.onAccent };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(5,5,10,0.85)", backdropFilter: "blur(6px)" }}>
      <div className="rise w-full max-w-md rounded-3xl border p-5" style={{ background: T.panel, borderColor: T.border, boxShadow: T.shadow, maxHeight: "92vh", overflowY: "auto" }}>
        <div className="mb-1 flex items-center justify-between">
          <Logo size={17} T={T} />
          <button onClick={finish} className="text-xs font-semibold" style={{ color: T.faint }}>Skip</button>
        </div>
        <div className="mb-3 mt-3 flex items-center gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="h-1 flex-1 rounded-full" style={{ background: step >= i ? T.accent : rgba(T.ink, 0.1), transition: "background .3s" }} />
          ))}
        </div>
        <div className="text-xs font-bold" style={{ color: T.accent }}>Step {step + 1} of 6</div>
        <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 19 }}>{TITLES[step]}</div>
        <div className="mb-4 text-xs" style={{ color: T.sub }}>{SUBS[step]}</div>

        {step === 0 && (
          <div className="grid grid-cols-2 gap-2">
            {ONB_TYPES.map(([t, I]) => (
              <button key={t} onClick={() => setEtype(t)} className="flex flex-col items-center gap-2 rounded-2xl border p-4" style={{ borderColor: etype === t ? T.accent : T.border, background: etype === t ? rgba(T.accent, 0.1) : T.panel2 }}>
                <I size={22} style={{ color: etype === t ? T.accent : T.sub }} /><span className="text-sm font-semibold">{t}</span>
                {etype === t && <CheckCircle2 size={14} style={{ color: T.accent }} />}
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {([["Event date", WEDDING.dateLabel], ["Start time", "14:00"], ["Location", "Muldersdrift, Gauteng"]] as [string, string][]).map(([l, v]) => (
              <div key={l} className="rounded-xl border px-3 py-2.5" style={{ borderColor: T.border, background: T.panel2 }}>
                <div className="text-xs" style={{ color: T.faint }}>{l}</div>
                <div className="text-sm font-semibold">{v}</div>
              </div>
            ))}
            <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: T.border, background: T.panel2 }}>
              <div className="flex justify-between text-xs" style={{ color: T.faint }}><span>How many guests?</span><span className="font-bold" style={{ color: T.ink }}>{guests}</span></div>
              <input type="range" min={10} max={400} step={10} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-1 w-full" aria-label="Guests" />
            </div>
            <div className="flex items-start gap-2 rounded-xl p-2.5 text-xs" style={{ background: rgba(T.gold, 0.1), color: T.gold }}>
              <Sparkles size={13} className="mt-0.5 shrink-0" />
              <span><b>{guests} guests → {coreN} core suppliers.</b> Bigger events unlock more mandatory roles — coordination load scales with headcount.</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <MoodTile T={T} pal={pal} h={120}>
              <div className="absolute bottom-2 left-2 rounded-lg px-2 py-1 text-xs font-bold" style={{ background: "rgba(5,5,10,0.6)", color: "#fff" }}>{PALETTES[pal].name}</div>
            </MoodTile>
            <div className="flex gap-1.5">{PALETTES[pal].cols.map((c) => <span key={c} className="h-7 flex-1 rounded-md" style={{ background: c }} />)}</div>
            <div className="grid grid-cols-4 gap-2">
              {PALETTES.map((p, i) => (
                <button key={p.name} onClick={() => setPal(i)} className="press overflow-hidden rounded-lg border" style={{ borderColor: pal === i ? T.accent : T.border, borderWidth: pal === i ? 2 : 1 }}>
                  <div className="relative">
                    <PaletteShot pid={p.img} pal={i} T={T} h={54} />
                    {pal === i && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: T.accent }}><Check size={10} style={{ color: T.onAccent }} /></span>}
                  </div>
                  <div className="flex h-3">{p.cols.slice(0, 5).map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
                  <div className="truncate px-1 py-0.5 text-center" style={{ fontSize: 8, color: T.sub }}>{p.name.split(" ")[0]}</div>
                </button>
              ))}
            </div>
            <Effect T={T}>Every option shows the palette in a real wedding setting. Buttons, rings, charts and highlights all switch to <b>{PALETTES[pal].name}</b> the moment you continue.</Effect>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {ONB_PRIOR.map((p) => {
                const on = prior.has(p);
                return (
                  <button
                    key={p}
                    onClick={() => setPrior((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else if (n.size < 5) n.add(p); return n; })}
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                    style={{ borderColor: on ? T.accent : T.border, background: on ? T.accent : T.panel2, color: on ? T.onAccent : T.ink }}
                  >
                    {p}{on ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
            <Effect T={T}>
              {pRoles.size > 0 ? <>Suppliers for <b>{[...pRoles].join(", ")}</b> move to the top of your bench, get a priority ribbon, and count double toward core readiness.</> : <>Pick at least one — priorities decide which suppliers surface first and what your readiness score rewards.</>}
              {why.length > 0 && <><br />{why.join(" · ")}</>}
            </Effect>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: T.border, background: T.panel2 }}>
              <div className="flex justify-between text-xs" style={{ color: T.faint }}><span>Budget range</span><span className="font-bold" style={{ color: T.ink }}>{fmtR(budget)}</span></div>
              <input type="range" min={100} max={800} step={10} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-1 w-full" aria-label="Budget" />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-bold" style={{ color: T.sub }}>PLANNING SUPPORT</div>
              {["I'll plan myself", "I need some guidance", "Full planning support"].map((o) => (
                <button key={o} onClick={() => setSupp(o)} className="mb-1.5 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm" style={{ borderColor: supp === o ? T.accent : T.border, background: supp === o ? rgba(T.accent, 0.1) : T.panel2 }}>
                  {o}{supp === o && <CheckCircle2 size={14} style={{ color: T.accent }} />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(["WhatsApp", "Email", "Call"] as const).map((o) => (
                <button key={o} onClick={() => setComm(o)} className="flex-1 rounded-xl border py-2 text-xs font-semibold" style={{ borderColor: comm === o ? T.accent : T.border, background: comm === o ? T.accent : T.panel2, color: comm === o ? T.onAccent : T.ink }}>{o}</button>
              ))}
            </div>
            <Effect T={T}>Budget cap starts at <b>{fmtR(budget)}</b> — the optimizer runs against it immediately. RSVP chasing opens <b>{comm}</b> with the message pre-written.</Effect>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <MoodTile T={T} pal={pal} h={110} />
            <div className="space-y-1.5 text-left text-xs">
              {([
                ["Event", `${etype} · ${guests} guests`, `Core squad sized to ${coreN} roles`],
                ["Palette", PALETTES[pal].name, "Accent colour applied across the board"],
                ["Priorities", [...prior].join(", ") || "none", pRoles.size ? `${[...pRoles].join(", ")} ranked first + double weight` : "no supplier reordering"],
                ["Budget", fmtR(budget), "Live cap for the optimizer"],
                ["Channel", comm, "Used for RSVP reminders"],
                ["Support", supp, supp === "Full planning support" ? "Lungi acts first, tells you after" : supp === "I need some guidance" ? "Lungi suggests, you decide" : "Lungi stays quiet unless asked"],
              ] as [string, string, string][]).map(([k, v, eff]) => (
                <div key={k} className="flex items-start gap-2 rounded-xl border px-3 py-2" style={{ borderColor: T.border, background: T.panel2 }}>
                  <div className="w-16 shrink-0 font-bold" style={{ color: T.faint }}>{k}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold" style={{ color: T.ink }}>{v}</div>
                    <div className="flex items-center gap-1" style={{ color: T.gold }}><ArrowRight size={10} className="shrink-0" />{eff}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: T.border, color: T.sub }}><ChevronLeft size={15} /></button>
          )}
          <button onClick={() => (step === 5 ? finish() : setStep((s) => s + 1))} className="flex-1 rounded-xl py-2.5 text-sm font-bold" style={btnA}>{step === 5 ? "Apply & open board" : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
