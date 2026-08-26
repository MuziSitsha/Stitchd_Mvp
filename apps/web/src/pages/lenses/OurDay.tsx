import { useState } from "react";
import { CheckCircle2, Circle, Globe2, Copy, Check, Plane, Sparkles } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Face } from "../../components/proto/Face";
import { Shot } from "../../components/proto/Shot";
import { WEDDING, SECOND_EVENT, DAYS_LEFT, STORY_SEED, PARTY_SEED, DECISIONS_SEED, PAPERWORK_SEED, randR } from "../../components/proto/data";
import { PALETTES } from "../../theme/palettes";
import { useProtoState } from "../../state/ProtoState";
import type { Theme } from "../../theme/theme";
import type { LensKey } from "../../components/proto/AppShell";

const partyTone = (T: Theme, tone: "good" | "gold" | "info") => (tone === "good" ? T.good : tone === "gold" ? T.gold : T.info);
const siteSlug = WEDDING.couple.toLowerCase().replace(/\s*&\s*/g, "-").replace(/[^a-z-]/g, "");

// Us > Our day — the couple's own story, party and shared decisions. Story
// strip and party cards are net-new seed content (STORY_SEED/PARTY_SEED in
// data.ts); paperwork and decisions likewise. Everything else (countdown,
// venue, task cross-link, honeymoon fund) reads real WEDDING/TASKS_SEED/
// registry state rather than a second, disconnected set of numbers —
// honeymoon in particular reads the same mutable ProtoState.registry Gifts
// writes to, not a stale copy of the seed.
export function OurDay({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T, pal } = useTheme();
  const { setShowOnb, registry } = useProtoState();
  const [copied, setCopied] = useState(false);
  const doneCount = PAPERWORK_SEED.filter((p) => p.done).length;
  const decisions = [...DECISIONS_SEED, { q: "Colour story", a: PALETTES[pal].name, who: "Set in Vision" }];
  const honeymoon = registry.find((r) => r.item.toLowerCase().includes("honeymoon"));

  function copyLink() {
    navigator.clipboard?.writeText(`https://stitchd.co.za/${siteSlug}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rise space-y-3">
      <Card T={T} className="overflow-hidden !p-0">
        <Shot cat="Venue" T={T} pal={pal} h={220} />
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>{WEDDING.dateLabel.toUpperCase()} · {DAYS_LEFT} DAYS</div>
            <div className="mt-1 text-2xl font-extrabold">{WEDDING.couple}</div>
            <div className="text-xs" style={{ color: T.sub }}>{WEDDING.venue} · ceremony 15:00 · 140 guests</div>
          </div>
          <button onClick={() => setShowOnb(true)} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#1A1726", color: "#fff" }}>Edit our details</button>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <Card T={T}>
            <div className="mb-2 text-sm font-bold">How we got here</div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {STORY_SEED.map((s) => (
                <div key={s.title} className="flex flex-col gap-1.5">
                  {s.cat ? (
                    <Shot cat={s.cat} T={T} pal={pal} h={78} radius={12} />
                  ) : (
                    <Shot seed={s.shotSeed} T={T} pal={pal} h={78} radius={12} />
                  )}
                  <div className="text-[10px] font-bold" style={{ color: T.accent }}>{s.year}</div>
                  <div className="text-xs font-bold leading-tight">{s.title}</div>
                  <div className="text-[11px] leading-tight" style={{ color: T.sub }}>{s.note}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card T={T}>
            <div className="mb-2 text-sm font-bold">Your people, and what they're holding</div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {PARTY_SEED.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                  <Face seed={p.seed} female={p.female} name={p.name} T={T} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{p.name}</div>
                    <div className="text-[11px] font-semibold" style={{ color: T.accent }}>{p.role}</div>
                    <div className="truncate text-[11px]" style={{ color: T.sub }}>{p.job}</div>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: rgba(partyTone(T, p.tone), 0.14), color: partyTone(T, p.tone) }}>{p.state}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card T={T}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold">Decisions you've already made</div>
              <button onClick={() => setLens("vision")} className="text-xs font-bold" style={{ color: T.accent }}>The look and feel →</button>
            </div>
            <div className="divide-y" style={{ borderColor: T.border }}>
              {decisions.map((d) => (
                <div key={d.q} className="grid grid-cols-1 gap-1 py-2.5 text-xs sm:grid-cols-[140px_1fr_auto] sm:items-center sm:gap-3" style={{ borderColor: T.border }}>
                  <span className="font-bold" style={{ color: T.sub }}>{d.q}</span>
                  <span className="font-semibold">{d.a}</span>
                  <span style={{ color: T.faint }}>{d.who}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Card T={T} style={{ background: "#1A1726", borderColor: "#1A1726" }}>
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#F2C14E", letterSpacing: 1 }}><Globe2 size={12} />YOUR WEDDING WEBSITE</div>
            <div className="mt-1.5 text-sm font-extrabold" style={{ color: "#fff" }}>stitchd.co.za/{siteSlug}</div>
            <div className="mt-1.5 text-xs" style={{ color: rgba("#fff", 0.65) }}>RSVP form, directions to {WEDDING.venue}, dress code and the registry — all live for your guests.</div>
            <button onClick={copyLink} className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#F2C14E", color: "#3A2A05" }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copied" : "Copy link"}
            </button>
          </Card>

          <Card T={T}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold">Making it legal</div>
              <span className="text-xs font-bold" style={{ color: T.good }}>{doneCount}/{PAPERWORK_SEED.length}</span>
            </div>
            <div className="space-y-2.5">
              {PAPERWORK_SEED.map((p) => (
                <div key={p.title} className="flex items-start gap-2">
                  {p.done ? <CheckCircle2 size={15} style={{ color: T.good, marginTop: 1 }} /> : <Circle size={15} style={{ color: T.faint, marginTop: 1 }} />}
                  <div className="min-w-0">
                    <div className="text-xs font-bold">{p.title}</div>
                    <div className="text-[11px]" style={{ color: T.sub }}>{p.note}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setLens("week")} className="mt-3 text-xs font-bold" style={{ color: T.accent }}>See it on the task list →</button>
          </Card>

          <Card T={T}>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}><Sparkles size={12} />TWO CELEBRATIONS</div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 rounded-lg px-2 py-1 text-center" style={{ background: T.panel2, minWidth: 40 }}>
                  <div className="text-xs font-extrabold">14</div>
                  <div className="text-[9px] font-bold" style={{ color: T.faint }}>NOV</div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold">White wedding</div>
                  <div className="text-[11px]" style={{ color: T.sub }}>{WEDDING.venue} · 140 guests</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 rounded-lg px-2 py-1 text-center" style={{ background: T.panel2, minWidth: 40 }}>
                  <div className="text-xs font-extrabold">21</div>
                  <div className="text-[9px] font-bold" style={{ color: T.faint }}>NOV</div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold">{SECOND_EVENT.name}</div>
                  <div className="text-[11px]" style={{ color: T.sub }}>{SECOND_EVENT.venue} · {SECOND_EVENT.guests} guests</div>
                  <div className="text-[11px]" style={{ color: T.faint }}>{SECOND_EVENT.note}</div>
                </div>
              </div>
            </div>
          </Card>

          {honeymoon && (
            <Card T={T} style={{ background: rgba(T.accent, 0.08), borderColor: rgba(T.accent, 0.35) }}>
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.accent, letterSpacing: 1 }}><Plane size={12} />HONEYMOON</div>
              <div className="mt-1.5 text-sm font-extrabold">{randR(honeymoon.got)} <span className="font-semibold" style={{ color: T.faint }}>of {randR(honeymoon.target)}</span></div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: T.panel2 }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (honeymoon.got / honeymoon.target) * 100)}%`, background: T.accent }} />
              </div>
              <button onClick={() => setLens("gifts")} className="mt-2.5 text-xs font-bold" style={{ color: T.accent }}>See the fund →</button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
