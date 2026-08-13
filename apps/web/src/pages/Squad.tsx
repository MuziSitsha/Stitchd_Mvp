import { useMemo, useState } from "react";
import {
  Sparkles, Wallet, Users, Mail, CheckCircle2, Clock, ClipboardCheck, ArrowRight, ChevronRight,
  ShoppingBag, Gift, Star, ArrowLeftRight, AlertTriangle, UsersRound, Shield, Radio, Timer, CloudRain, Tent, Pencil,
} from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { PALETTES, PALETTE_ROLES } from "../theme/palettes";
import { Card } from "../components/proto/Card";
import { Chip } from "../components/proto/Chip";
import { Face } from "../components/proto/Face";
import { Ring } from "../components/proto/Ring";
import { FutCard, EmptySlot } from "../components/proto/FutCard";
import { KpiTile } from "../components/proto/Kpi";
import type { KpiDef } from "../components/proto/Kpi";
import { rolesFor, weightsFor, scoreReadiness } from "../components/proto/readiness";
import {
  WEDDING, DAYS_LEFT, RSVP_DAYS,
  RSVP_BASE, perfScore, fmtR, type Supplier,
} from "../components/proto/data";
import { useProtoState } from "../state/ProtoState";
import { useBudget } from "../state/useBudget";
import { useLiveSupplierStatus } from "../state/useLiveSupplierStatus";
import type { LensKey } from "../components/proto/AppShell";

const WEATHER = { temp: 24, cond: "Partly cloudy", rain: 55, days: [["WED", 21, 10], ["THU", 22, 20], ["FRI", 24, 35], ["SAT", 23, 55], ["SUN", 21, 20]] as [string, number, number][] };

export function Squad({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T, pal } = useTheme();
  const { sup, setSup, gList, tasks, budgetCap, bundleApplied, toast, secure, moveZone, applyBundle, guests, profile, setSelSup, setReadyOpen, setShowOnb } = useProtoState();
  const [briefOpen, setBriefOpen] = useState(false);
  const [drag, setDrag] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<"core" | "bench" | null>(null);

  const priorSet = profile.prior;
  const pRoles = useMemo(() => rolesFor(priorSet), [priorSet]);
  const { w: WEIGHTS } = useMemo(() => weightsFor(priorSet), [priorSet]);
  const { BUDGET_ITEMS, budget, pCats } = useBudget();
  const live = useLiveSupplierStatus();

  const coreN = guests < 80 ? 5 : guests <= 150 ? 6 : guests <= 250 ? 8 : 10;
  const rank = (s: Supplier) => (pRoles.has(s.role) ? 0 : 1);
  const coreList = useMemo(() => sup.filter((s) => s.zone === "core"), [sup]);
  const benchList = useMemo(() => sup.filter((s) => s.zone === "bench").sort((a, b) => rank(a) - rank(b) || perfScore(b) - perfScore(a)), [sup, pRoles]);

  const rsvp = useMemo(() => {
    const seats = gList.reduce((a, g) => a + g.party, 0);
    const yesSeats = gList.filter((g) => g.rsvp === "yes").reduce((a, g) => a + g.party, 0);
    const pendSeats = gList.filter((g) => g.rsvp === "pending").reduce((a, g) => a + g.party, 0);
    const pending = gList.filter((g) => g.rsvp === "pending");
    return {
      yes: gList.filter((g) => g.rsvp === "yes").length,
      pend: pending.length,
      pendSeats,
      headcount: RSVP_BASE.seats + yesSeats,
      pct: Math.round(((seats - pendSeats) / (seats || 1)) * 100),
    };
  }, [gList]);
  const rsvpCrit = rsvp.pend > 0 && RSVP_DAYS < 90;

  const budgetHealth = budget.overLocked ? 40 : budget.headroom >= 0 ? 100 : 60;
  const R = useMemo(() => scoreReadiness({ sup, gList, tasks, budgetHealth, w: WEIGHTS, pRoles }), [sup, gList, tasks, budgetHealth, WEIGHTS, pRoles]);

  const KPIS: Record<string, KpiDef> = useMemo(() => {
    const conf = sup.filter((s) => s.status === "confirmed").length;
    const supPct = Math.round((conf / sup.length) * 100);
    const yesSeats = gList.filter((g) => g.rsvp === "yes").reduce((a, g) => a + g.party, 0);
    const taskPct = Math.round((tasks.filter((t) => t.st === "done").length / tasks.length) * 100);

    const paletteBound = sup.filter((s) => PALETTE_ROLES[s.role]);
    const paletteConf = paletteBound.filter((s) => s.status === "confirmed").length;
    const chemParts = [
      Math.round((paletteConf / (paletteBound.length || 1)) * 100),
      100 - sup.filter((s) => s.status === "issue").length * 45,
      R.rsvpPct,
      budget.headroom >= 0 ? 100 : 55,
    ];
    const chemistry = Math.max(0, Math.round(chemParts.reduce((a, b) => a + b, 0) / chemParts.length));
    const chemInsight = sup.some((s) => s.status === "issue")
      ? "One supplier conflict is pulling theme alignment down."
      : paletteConf < paletteBound.length ? "Your palette suppliers aren't all locked yet." : "Theme, suppliers and palette are aligned.";

    const confirmedCost = BUDGET_ITEMS.filter((b) => b.paid).reduce((a, b) => a + b.cost, 0);
    const estimatedCost = BUDGET_ITEMS.filter((b) => !b.paid && budget.kept.has(b.id)).reduce((a, b) => a + b.cost, 0);
    const contingency = Math.max(0, budget.headroom);
    const brParts = [
      budget.overLocked ? 30 : 100,
      Math.min(100, Math.round((confirmedCost / (confirmedCost + estimatedCost || 1)) * 100) + 20),
      contingency > 20 ? 100 : contingency > 0 ? 70 : 40,
    ];
    const budgetReady = Math.max(0, Math.round(brParts.reduce((a, b) => a + b, 0) / brParts.length));
    const budgetRisk = budget.overLocked ? "Locked costs exceed your cap — trim or raise it." : contingency <= 0 ? "No contingency left for day-of surprises." : estimatedCost > confirmedCost ? "More of the budget is estimated than confirmed." : "Healthy buffer, most costs confirmed.";

    const paySoon = tasks.filter((t) => /pay|deposit|R\d/i.test(t.title) && t.st !== "done");

    return {
      chemistry: { v: chemistry, label: "Chemistry", insight: chemInsight, act: sup.some((s) => s.status === "issue") ? "Resolve supplier clash" : "Lock palette suppliers", go: () => setLens("suppliers"), I: Sparkles },
      budgetReady: { v: budgetReady, label: "Budget Readiness", insight: budgetRisk, act: "Open budget", go: () => setLens("budget"), I: Wallet },
      supplier: { v: supPct, label: "Supplier Progress", insight: `${conf} of ${sup.length} suppliers confirmed`, act: "Open squad", go: () => setLens("squad"), I: Users },
      guest: { v: R.rsvpPct, label: "Guest Readiness", insight: `${yesSeats} seats confirmed · ${rsvp.pend} households pending`, act: "Chase RSVPs", go: () => setLens("rsvp"), I: Mail },
      planning: { v: taskPct, label: "Planning Completion", insight: `${tasks.filter((t) => t.st !== "done").length} tasks still open`, act: "Open tasks", go: () => setLens("tasks"), I: CheckCircle2 },
      payments: { v: paySoon.length, isCount: true, label: "Upcoming Payments", insight: paySoon.length ? `Next: ${paySoon[0].title.replace(/\(.*\)/, "").trim()}` : "No payments due", act: "Open tasks", go: () => setLens("tasks"), I: Clock },
    };
  }, [sup, gList, tasks, budget, R.rsvpPct, rsvp.pend, BUDGET_ITEMS, setLens]);

  const securedTotal = sup.filter((s) => s.status === "confirmed").length;
  const chemistry = securedTotal ? Math.round((sup.filter((s) => s.status === "confirmed").reduce((a, s) => a + perfScore(s), 0) / securedTotal) * 0.92) : 0;

  function dropTo(zone: "core" | "bench") {
    if (!drag) return;
    setSup((ss) => ss.map((x) => (x.id === drag ? { ...x, zone } : x)));
    const s = sup.find((x) => x.id === drag);
    if (zone === "core" && coreList.length >= coreN && s?.zone !== "core") toast(`Added to core — now over the recommended ${coreN}`, "warn");
    setDrag(null);
    setHoverZone(null);
  }

  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };

  return (
    <div className="rise flex flex-col gap-4">
      <div className="-mx-3 mb-1 flex gap-2 overflow-x-auto px-3 pb-1">
        {["chemistry", "budgetReady", "supplier", "guest", "planning", "payments"].map((key) => (
          <div key={key} className="w-40 shrink-0"><KpiTile k={KPIS[key]} T={T} compact /></div>
        ))}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: T.border, boxShadow: T.shadow }}>
          <div className="absolute inset-0" style={{ background: `linear-gradient(110deg, ${PALETTES[pal].cols[2]}, ${PALETTES[pal].cols[0]} 55%, ${PALETTES[pal].cols[1]})` }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${rgba("#05050A", 0.82)} 0%, ${rgba("#05050A", 0.45)} 60%, transparent 100%)` }} />
          <div className="relative flex items-center gap-3 p-3.5">
            <div className="flex -space-x-3">
              <Face seed="junior" female={false} T={T} size={46} name="Junior Mokoena" ring={PALETTES[pal].cols[4]} />
              <Face seed="nadine" female={true} T={T} size={46} name="Nadine Ndlovu" ring={PALETTES[pal].cols[4]} />
            </div>
            <div className="min-w-0 flex-1">
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 21, fontWeight: 600, letterSpacing: 0.2, color: "#F6F3EC", lineHeight: 1.02 }}>
                {WEDDING.couple.replace(" & ", " & ")}
              </div>
              <div className="truncate" style={{ fontSize: 10.5, color: rgba("#F6F3EC", 0.72) }}>{WEDDING.venue} · {WEDDING.dateLabel}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {[[`${DAYS_LEFT}d`, "TO KICK-OFF"], [`${guests}`, "GUESTS"], [`${coreList.filter((x) => x.status === "confirmed").length}/${coreN}`, "SQUAD"], [`${R.total}`, "READY"]].map(([v, l]) => (
                  <span key={l} className="rounded px-1.5 py-0.5" style={{ background: rgba("#F6F3EC", 0.14) }}>
                    <b style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 10.5, color: "#F6F3EC" }}>{v}</b>
                    <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 0.7, color: rgba("#F6F3EC", 0.65), marginLeft: 3 }}>{l}</span>
                  </span>
                ))}
              </div>
            </div>
            <Face seed="coach" T={T} size={38} name="Lungi Dlodlo" ring={PALETTES[pal].cols[4]} />
          </div>
        </div>

        <Card T={T}>
          <button onClick={() => setBriefOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
            <ClipboardCheck size={15} style={{ color: T.gold }} />
            <span className="text-sm font-bold">Your brief</span>
            <span className="truncate text-xs" style={{ color: T.sub }}>{profile.prior.size} priorities · cap {fmtR(budgetCap)} · {profile.comm} · {PALETTES[pal].name}</span>
            <ChevronRight size={15} className="ml-auto shrink-0" style={{ color: T.faint, transform: briefOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
          </button>
          {briefOpen && (
            <div className="mt-3 space-y-1.5">
              {([
                ["Guests", `${guests}`, `Core squad sized to ${coreN} roles`],
                ["Priorities", [...profile.prior].join(", ") || "none set", pRoles.size ? `${[...pRoles].join(", ")} ranked first, ribboned, double-weighted in readiness` : "no supplier reordering"],
                ["Budget", fmtR(budgetCap), `Optimizer protects ${[...pCats].join(", ") || "high-need items"} first`],
                ["Channel", profile.comm, "RSVP send buttons open this channel"],
                ["Palette", PALETTES[pal].name, "Accent colour across buttons, rings and charts"],
                ["Support", profile.supp, profile.supp === "Full planning support" ? "Lungi acts, then reports" : profile.supp === "I need some guidance" ? "Lungi flags, you decide" : "Lungi waits to be asked"],
              ] as [string, string, string][]).map(([k, v, eff]) => (
                <div key={k} className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: T.panel2 }}>
                  <div className="w-16 shrink-0 font-bold" style={{ color: T.faint }}>{k}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{v}</div>
                    <div className="flex items-start gap-1" style={{ color: T.gold }}><ArrowRight size={10} className="mt-0.5 shrink-0" />{eff}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowOnb(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={btnG}><Pencil size={12} />Change answers</button>
            </div>
          )}
        </Card>

        <button onClick={() => setLens("stitchit")} className="press lift group relative w-full overflow-hidden rounded-2xl border p-0 text-left" style={{ borderColor: rgba(T.gold, 0.45) }}>
          <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${rgba(T.accent, 0.2)}, ${rgba(T.gold, 0.14)})` }} />
          <div className="relative flex items-center gap-3 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: rgba(T.gold, 0.18) }}><ShoppingBag size={20} style={{ color: T.gold }} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold">Need something this weekend?</span>
                <span className="rounded-full px-1.5 py-0.5" style={{ fontSize: 8.5, fontWeight: 800, background: T.gold, color: T.onGold }}>NEW</span>
              </div>
              <div className="text-xs" style={{ color: T.sub }}>Hire marquees, DJs, jumping castles, a braai — from vetted Joburg suppliers. Instant price, no planning. <b style={{ color: T.gold }}>Just stitch it.</b></div>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold" style={btnA}>Browse <ArrowRight size={13} /></span>
          </div>
        </button>

        {(() => {
          const venue = sup.find((s) => s.bundle);
          if (!venue || !venue.bundle) return null;
          return !bundleApplied ? (
            <Card T={T} style={{ borderColor: rgba(T.gold, 0.5), background: `linear-gradient(120deg, ${rgba(T.gold, 0.1)}, transparent)` }}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: rgba(T.gold, 0.15) }}><Gift size={19} style={{ color: T.gold }} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold">{venue.name} — multi-service supplier</span>
                    <Chip c={T.gold} T={T}>Package includes {venue.bundle.length}</Chip>
                    <Chip c={T.good} T={T}>Save {fmtR(venue.bundleSaving!)}</Chip>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {venue.bundle.map(([svc, cost]) => (
                      <span key={svc} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 tnum" style={{ fontSize: 10.5, background: T.panel2, color: T.sub }}>{svc} <b style={{ color: T.ink }}>{fmtR(cost)}</b></span>
                    ))}
                  </div>
                  <div className="mt-1.5 text-xs tnum" style={{ color: T.sub }}>
                    À la carte <b style={{ color: T.ink }}>{fmtR(venue.bundleList!)}</b> → package <b style={{ color: T.good }}>{fmtR(venue.price)}</b>. One contract, one deposit, one point of contact.
                  </div>
                </div>
                <button onClick={applyBundle} className="shrink-0 self-center rounded-lg px-3 py-2 text-xs font-bold press" style={btnA}>Apply</button>
              </div>
            </Card>
          ) : (
            <Card T={T} style={{ borderColor: rgba(T.good, 0.4) }}>
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: T.good }}>
                <CheckCircle2 size={15} />{venue.name} package active — {fmtR(venue.bundleSaving!)} saved
              </div>
            </Card>
          );
        })()}

        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border, background: T.panel }}>
          <div className="relative" style={{ background: `linear-gradient(180deg, ${rgba(T.accent, 0.16)}, ${rgba(T.gold, 0.07)})` }}>
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: T.mode === "dark" ? 0.16 : 0.11 }}>
              <rect x="1" y="1" width="398" height="118" fill="none" stroke={T.ink} strokeWidth="1" />
              <line x1="200" y1="0" x2="200" y2="120" stroke={T.ink} strokeWidth="1" />
              <circle cx="200" cy="60" r="26" fill="none" stroke={T.ink} strokeWidth="1" />
              <rect x="1" y="32" width="42" height="56" fill="none" stroke={T.ink} strokeWidth="1" />
              <rect x="357" y="32" width="42" height="56" fill="none" stroke={T.ink} strokeWidth="1" />
            </svg>
            <div className="relative px-3 pb-3 pt-2.5">
              <div className="mb-2 flex items-center gap-2">
                <Star size={13} style={{ color: T.gold }} fill="currentColor" />
                <span style={{ ...bigNum, fontSize: 12, letterSpacing: 1.4 }}>STARTING XI</span>
                <span className="rounded-full px-1.5 py-0.5" style={{ fontSize: 9, fontWeight: 800, background: rgba(coreList.length > coreN ? T.bad : T.ink, 0.1), color: coreList.length > coreN ? T.bad : T.sub }}>
                  {coreList.length}/{coreN}
                </span>
                <span className="ml-auto hidden items-center gap-1 sm:flex" style={{ fontSize: 9.5, color: T.faint }}><ArrowLeftRight size={10} />drag between rows</span>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setHoverZone("core"); }}
                onDragLeave={() => setHoverZone(null)}
                onDrop={() => dropTo("core")}
                className="flex gap-2.5 overflow-x-auto pb-1"
                style={{ outline: hoverZone === "core" ? `2px dashed ${T.accent}` : "none", outlineOffset: 4, borderRadius: 12 }}
              >
                {coreList.map((s) => (
                  <FutCard key={s.id} s={s} T={T} pal={pal} w={152} draggable onDragStart={() => setDrag(s.id)} priority={pRoles.has(s.role)} live={live.get(s.name)} onOpen={() => setSelSup(s.id)} onSecure={() => secure(s.id)} onMove={() => moveZone(s.id)} />
                ))}
                {Array.from({ length: Math.max(0, coreN - coreList.length) }).map((_, i) => {
                  const pick = benchList.filter((b) => !coreList.some((c) => c.role === b.role))[i] || benchList[i];
                  return (
                    <EmptySlot key={`e${i}`} T={T} w={152} role={pick?.role} hint={pick ? pick.name.split(" ")[0].toUpperCase() : "BENCH"} onFill={() => (pick ? moveZone(pick.id) : toast("Bench is empty", "warn"))} />
                  );
                })}
              </div>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setHoverZone("bench"); }}
            onDragLeave={() => setHoverZone(null)}
            onDrop={() => dropTo("bench")}
            className="border-t px-3 pb-3 pt-2.5"
            style={{ borderColor: T.border, background: hoverZone === "bench" ? rgba(T.accent, 0.06) : "transparent" }}
          >
            <div className="mb-2 flex items-center gap-2">
              <UsersRound size={13} style={{ color: T.accent }} />
              <span style={{ ...bigNum, fontSize: 12, letterSpacing: 1.4 }}>SUBS BENCH</span>
              <span className="rounded-full px-1.5 py-0.5" style={{ fontSize: 9, fontWeight: 800, background: rgba(T.ink, 0.08), color: T.sub }}>{benchList.length}</span>
              {pRoles.size > 0 && <span className="ml-auto truncate" style={{ fontSize: 9.5, color: T.gold }}>priority roles ranked first</span>}
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {benchList.map((s) => (
                <FutCard key={s.id} s={s} T={T} pal={pal} w={132} draggable onDragStart={() => setDrag(s.id)} priority={pRoles.has(s.role)} live={live.get(s.name)} onOpen={() => setSelSup(s.id)} onSecure={() => secure(s.id)} onMove={() => moveZone(s.id)} />
              ))}
              {benchList.length === 0 && <div className="py-6 text-center text-xs" style={{ color: T.faint }}>Everyone's on the pitch.</div>}
            </div>
          </div>
        </div>

        <Card T={T} className="grid grid-cols-2 gap-4">
          {[
            { I: Shield, l: "SECURED", v: `${securedTotal}/${sup.length}`, s: "Suppliers confirmed", c: T.good, go: () => setLens("suppliers") },
            { I: UsersRound, l: "CHEMISTRY", v: `${chemistry}%`, s: "Squad strength score", c: T.good, go: () => setLens("suppliers") },
            { I: Wallet, l: "BUDGET LEFT", v: fmtR(Math.max(0, budget.headroom)), s: bundleApplied ? "incl. R71k saved" : "to allocate", c: T.gold, go: () => setLens("budget") },
            { I: Radio, l: "COMMS", v: "Centralised", s: "One place for all chats", c: T.accent, go: () => setLens("chat") },
          ].map((k) => (
            <button key={k.l} onClick={k.go} className="flex items-start gap-2.5 text-left">
              <k.I size={19} style={{ color: k.c }} className="mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold" style={{ color: T.faint, letterSpacing: 1, fontSize: 9 }}>{k.l}</div>
                <div className="text-sm font-bold" style={{ color: k.c }}>{k.v}</div>
                <div className="truncate text-xs" style={{ color: T.sub }}>{k.s}</div>
              </div>
            </button>
          ))}
        </Card>
      </div>

      <div className="space-y-2.5">
        <Card T={T} className="flex items-center gap-3">
          <Face seed="coach" T={T} size={46} name="Lungi Dlodlo" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold" style={{ color: T.gold, letterSpacing: 1 }}>COACH</div>
            <div className="text-sm font-bold">Lungi Dlodlo</div>
            <div className="text-xs" style={{ color: T.sub }}>Lead Planner &amp; Strategist</div>
          </div>
          <button onClick={() => setLens("coach")} className="rounded-lg p-2" style={btnG}><ChevronRight size={15} /></button>
        </Card>

        <Card T={T}>
          <div className="flex items-center gap-3">
            <Ring score={R.total} T={T} size={72} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold" style={{ color: T.gold, letterSpacing: 1 }}>READINESS</div>
              <div className="text-sm font-semibold">{R.total >= 90 ? "Almost there" : R.total >= 70 ? "On track" : "Needs attention"}</div>
              <button onClick={() => setReadyOpen(true)} className="mt-1 flex items-center gap-1 text-xs font-bold" style={{ color: T.accent }}>Path to 100 <ChevronRight size={12} /></button>
            </div>
          </div>
        </Card>

        <Card T={T} style={{ borderColor: rsvpCrit ? rgba(T.bad, 0.5) : T.border }}>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: rsvpCrit ? T.bad : T.gold, letterSpacing: 1 }}>
            {rsvpCrit && <AlertTriangle size={13} />}RSVP {rsvpCrit && "· CRITICAL"}
          </div>
          <div className="mt-1 flex items-end gap-3">
            <div>
              <div style={{ ...bigNum, fontSize: 26 }}>{rsvp.yes}<span style={{ fontSize: 13, color: T.sub }}>/{gList.length}</span></div>
              <div className="text-xs" style={{ color: T.sub }}>confirmed</div>
            </div>
            <div className="mb-0.5 flex-1">
              <div className="mb-1 flex gap-2 text-xs"><span style={{ color: T.warn }}>{rsvp.pend} pending</span><span style={{ color: T.bad }}>{gList.filter((g) => g.rsvp === "no").length} declined</span></div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.1) }}><div className="h-full rounded-full" style={{ width: `${rsvp.pct}%`, background: T.good }} /></div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs" style={{ color: rsvpCrit ? T.bad : T.sub }}><Clock size={10} className="mr-0.5 inline" />Deadline {RSVP_DAYS} days</span>
            <button onClick={() => setLens("rsvp")} className="ml-auto rounded-lg px-2.5 py-1 text-xs font-bold" style={btnA}>Manage</button>
          </div>
        </Card>

        <Card T={T}>
          <div className="text-xs font-bold" style={{ color: T.gold, letterSpacing: 1 }}>BUDGET OVERVIEW</div>
          <div style={{ ...bigNum, fontSize: 24 }}>{fmtR(budget.keptSum)}</div>
          <div className="text-xs" style={{ color: T.sub }}>of {fmtR(budgetCap)} · {Math.round((budget.keptSum / budgetCap) * 100)}% allocated</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.1) }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, (budget.keptSum / budgetCap) * 100)}%`, background: T.accent }} /></div>
          <div className="mt-1 flex justify-between text-xs"><span style={{ color: T.good }}>{fmtR(Math.max(0, budget.headroom))} left</span></div>
        </Card>

        <Card T={T}>
          <div className="flex items-center gap-2"><Timer size={16} style={{ color: T.gold }} /><div className="text-xs font-bold" style={{ color: T.gold, letterSpacing: 1 }}>TIME TO WEDDING</div></div>
          <div style={{ ...bigNum, fontSize: 26 }}>{DAYS_LEFT} <span style={{ fontSize: 11, color: T.sub }}>DAYS</span></div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.1) }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, 100 - (DAYS_LEFT / 365) * 100)}%`, background: T.accent }} /></div>
        </Card>

        <Card T={T} style={{ borderColor: rgba(T.accent, 0.4) }}>
          <div className="flex items-center gap-2 text-xs font-bold" style={{ color: T.accent, letterSpacing: 1 }}><CloudRain size={13} />WEATHER · {WEATHER.rain}% RAIN</div>
          <div className="mt-1 flex items-center gap-2"><span style={{ ...bigNum, fontSize: 24 }}>{WEATHER.temp}°</span><span className="text-xs" style={{ color: T.sub }}>{WEATHER.cond} on the day</span></div>
          <div className="mt-2 grid grid-cols-5 gap-1 text-center">
            {WEATHER.days.map(([d, t, r]) => (
              <div key={d} className="rounded-lg py-1" style={{ background: d === "SAT" ? rgba(T.accent, 0.15) : T.panel2, border: d === "SAT" ? `1px solid ${rgba(T.accent, 0.4)}` : "none" }}>
                <div className="font-bold" style={{ fontSize: 8 }}>{d}</div>
                <div className="text-xs font-semibold">{t}°</div>
                <div style={{ fontSize: 8, color: T.info }}>{r}%</div>
              </div>
            ))}
          </div>
          <button onClick={() => { const t = sup.find((x) => x.role === "Tent & Weather"); if (t) setSelSup(t.id); }} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold" style={btnA}><Tent size={12} />Add tent backup</button>
        </Card>
      </div>
    </div>
  );
}
