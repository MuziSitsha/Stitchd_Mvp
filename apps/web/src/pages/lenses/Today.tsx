import { useMemo } from "react";
import { CalendarPlus, AlertTriangle, CloudRain, Check, Circle, Sparkles } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba, mix } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Face } from "../../components/proto/Face";
import { Ring } from "../../components/proto/Ring";
import { Shot } from "../../components/proto/Shot";
import { WEDDING, DAYS_LEFT, RSVP_DAYS, RSVP_BASE, ROLE_ORDER, fmtR } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { useBudget } from "../../state/useBudget";
import { useReadiness } from "../../state/useReadiness";
import type { LensKey } from "../../components/proto/AppShell";

export const WEATHER = { temp: 24, cond: "Partly cloudy", rain: 55, days: [["WED", 21, 10], ["THU", 22, 20], ["FRI", 24, 35], ["SAT", 23, 55], ["SUN", 21, 20]] as [string, number, number][] };
const JOURNEY = [
  { k: "Dreaming", done: "Early planning" },
  { k: "Booking", done: "You are here" },
  { k: "Confirming", done: "Later this year" },
  { k: "Celebrating", done: WEDDING.dateLabel.replace("Sat ", "") },
] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Today({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T, pal } = useTheme();
  const { sup, gList, tasks, setSelSup } = useProtoState();
  const { R, sug } = useReadiness(setLens);
  const { budget } = useBudget();

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

  const confirmed = sup.filter((s) => s.status === "confirmed");
  const waiting = sup.filter((s) => s.status !== "confirmed");
  const openTasks = useMemo(() => [...tasks].filter((t) => t.st !== "done").sort((a, b) => a.due.localeCompare(b.due)), [tasks]);
  const nextTasks = openTasks.slice(0, 3);

  const journeyStage: number = DAYS_LEFT > 180 ? 1 : DAYS_LEFT > 30 ? 2 : 3;

  const categories = useMemo(
    () => ROLE_ORDER.filter((r) => sup.some((s) => s.role === r)).map((role) => {
      const roleSup = sup.filter((s) => s.role === role);
      const done = roleSup.every((s) => s.status === "confirmed");
      const issue = roleSup.some((s) => s.status === "issue");
      return { role, c: issue ? T.bad : done ? T.good : T.warn };
    }),
    [sup, T],
  );

  // 3 confirmed + 1 real waiting-on-you supplier, so this row shows the mix
  // of states that's actually true right now rather than only the good news.
  const spotlightSuppliers = useMemo(() => [...confirmed.slice(0, 3), ...waiting.slice(0, 1)], [confirmed, waiting]);

  const btnA = { background: T.accent, color: T.onAccent };
  const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };
  const decision = sug[0];
  const nudge = sug[1];

  function dateLabel(iso: string) {
    const d = new Date(iso);
    return { day: String(d.getDate()).padStart(2, "0"), month: MONTHS[d.getMonth()] };
  }

  return (
    <div className="rise flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          {/* HERO */}
          <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: T.border, boxShadow: T.shadow, background: `linear-gradient(135deg, #16131F 0%, ${mix("#1A1726", T.gold, 0.14)} 100%)` }}>
            <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(140% 130% at 100% 50%, ${rgba(T.gold, 0.22)}, transparent 55%)` }} />
            <div className="flex flex-col lg:flex-row">
              <div className="min-w-0 flex-1 p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: T.gold, color: T.onGold }}>{tasks.filter((t) => t.st === "done").length} things done this month</span>
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: rgba("#fff", 0.1), color: "#fff" }}>{openTasks.length === 0 ? "Nothing outstanding" : "Nothing is late"}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span style={{ ...bigNum, fontSize: 72, color: "#fff" }}>{DAYS_LEFT}</span>
                  <span style={{ fontSize: 15, color: "#fff" }}>days until<br /><b style={{ color: T.gold }}>you get married</b></span>
                </div>
                <div className="mt-1 text-xs" style={{ color: rgba("#fff", 0.72) }}>{WEDDING.couple} · {WEDDING.dateLabel} · {WEDDING.venue}</div>
                <div className="mt-4 text-xs font-bold" style={{ color: rgba("#fff", 0.6), letterSpacing: 1 }}>YOUR WEDDING, STITCHED TOGETHER</div>
                <div className="mt-1.5 flex items-center gap-1">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: rgba("#fff", 0.14) }}>
                    <div className="h-full rounded-full" style={{ width: `${R.total}%`, background: `linear-gradient(90deg, ${T.good}, ${T.gold})` }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{R.total}%</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {sup.slice(0, 8).map((s) => <Face key={s.id} seed={s.id} T={T} size={30} name={s.name} ring="#1A1726" />)}
                  </div>
                  <button onClick={() => setLens("team")} className="text-xs font-bold" style={{ color: T.gold }}>{confirmed.length} booked →</button>
                </div>
              </div>
              <div className="relative h-32 lg:h-full lg:w-56">
                <Shot role="Venue" seed="hero" T={T} pal={pal} h={280} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, #1A1726 0%, rgba(26,23,38,0.45) 45%, transparent 100%)` }} />
                <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 90% at 0% 100%, ${rgba(T.gold, 0.35)}, transparent 60%)`, mixBlendMode: "overlay" }} />
              </div>
            </div>
          </div>

          {/* WIDGET STRIP */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button onClick={() => setLens("coach")} className="text-left">
              <Card T={T} className="flex items-center gap-3">
                <Ring score={R.total} T={T} size={56} />
                <div className="min-w-0">
                  <div className="text-xs font-bold" style={{ color: T.gold, letterSpacing: 1 }}>READINESS</div>
                  <div className="text-xs font-bold">{R.total >= 90 ? "Almost there" : R.total >= 70 ? "On track" : `${sug.length} thing${sug.length === 1 ? "" : "s"} behind`}</div>
                  <div className="text-xs font-bold" style={{ color: T.accent }}>Path to 100 →</div>
                </div>
              </Card>
            </button>
            <button onClick={() => setLens("rsvp")} className="text-left">
              <Card T={T} style={{ borderColor: rsvpCrit ? rgba(T.bad, 0.5) : T.border }}>
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: rsvpCrit ? T.bad : T.gold, letterSpacing: 1 }}>
                  {rsvpCrit && <AlertTriangle size={12} />}RSVP · NEEDS YOU
                </div>
                <div style={{ ...bigNum, fontSize: 22 }}>{rsvp.yes}<span style={{ fontSize: 12, color: T.sub }}> of {gList.length} replied</span></div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.1) }}><div className="h-full rounded-full" style={{ width: `${rsvp.pct}%`, background: T.good }} /></div>
                <div className="mt-1 text-xs" style={{ color: T.faint }}>{rsvp.pend} never replied · deadline in {RSVP_DAYS} days →</div>
              </Card>
            </button>
            <button onClick={() => setLens("stitchit")} className="text-left">
              <Card T={T} style={{ borderColor: rgba(T.accent, 0.4) }}>
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: T.accent, letterSpacing: 1 }}><CloudRain size={12} />ON THE DAY</div>
                <div style={{ ...bigNum, fontSize: 22 }}>{WEATHER.temp}°<span className="text-xs font-normal" style={{ color: T.sub }}> · {WEATHER.rain}% rain</span></div>
                <div className="mt-1 text-xs" style={{ color: T.faint }}>A marquee backup is one tap away →</div>
              </Card>
            </button>
          </div>

          {/* YOUR DECISION TODAY */}
          {decision && (
            <div>
              <div className="mb-1.5 flex items-center gap-2 px-0.5">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: T.accent, opacity: 0.6 }} /><span className="relative h-2 w-2 rounded-full" style={{ background: T.accent }} /></span>
                <span style={{ ...bigNum, fontSize: 12, letterSpacing: 1.4 }}>YOUR DECISION TODAY</span>
              </div>
              <Card T={T} style={{ background: `linear-gradient(120deg, ${T.accent}, ${rgba(T.accent, 0.7)})`, borderColor: T.accent }}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{decision.t}</div>
                    {decision.money ? <div className="mt-1.5 text-xs" style={{ color: rgba("#fff", 0.85) }}>Saves {fmtR(decision.money * 1000)} against your current budget cap.</div> : <div className="mt-1.5 text-xs" style={{ color: rgba("#fff", 0.85) }}>Worth +{decision.pts} readiness points — the biggest single move on your board.</div>}
                    <div className="mt-3 flex gap-2">
                      <button onClick={decision.go} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#fff", color: T.accent }}>Handle it</button>
                      <button onClick={() => setLens("team")} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: rgba("#000", 0.18), color: "#fff" }}>See details</button>
                    </div>
                  </div>
                  {sug.length > 1 && (
                    <div className="shrink-0 rounded-xl p-3" style={{ background: rgba("#000", 0.18), minWidth: 150 }}>
                      <div className="text-xs" style={{ color: rgba("#fff", 0.65) }}>Then next</div>
                      <div className="mt-0.5 text-sm font-bold" style={{ color: "#fff" }}>{sug.length - 1} more thing{sug.length - 1 > 1 ? "s" : ""} this week</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* THIS WEEK */}
          <div>
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <span style={{ ...bigNum, fontSize: 12, letterSpacing: 1.4 }}>THIS WEEK</span>
              <button onClick={() => setLens("week")} className="text-xs font-bold" style={{ color: T.accent }}>All {tasks.length} tasks →</button>
            </div>
            <div className="space-y-2">
              {nextTasks.map((t) => (
                <Card key={t.id} T={T} className="flex items-center gap-3">
                  <Face seed={t.owner} T={T} size={30} name={t.owner} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{t.title}</div>
                    <div className="truncate text-xs" style={{ color: T.sub }}>{t.note || `due ${t.due}`}</div>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold" style={{ background: T.panel2, color: T.sub }}>{t.owner}</span>
                  <button onClick={() => setLens("week")} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={btnA}>Open</button>
                </Card>
              ))}
              {nextTasks.length === 0 && <div className="py-4 text-center text-xs" style={{ color: T.faint }}>Nothing open — you're caught up.</div>}
            </div>
          </div>

          {/* HOW THE DAY IS COMING TOGETHER */}
          <Card T={T}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">How the day is coming together</div>
              <button onClick={() => setLens("team")} className="text-xs font-bold" style={{ color: T.accent }}>Your suppliers →</button>
            </div>
            <div className="mt-3 flex items-start">
              {JOURNEY.map((stage, i) => (
                <div key={stage.k} className="flex flex-1 items-start last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: i < journeyStage ? T.good : i === journeyStage ? T.accent : T.panel2, color: i <= journeyStage ? "#fff" : T.faint }}>
                      {i < journeyStage ? <Check size={12} /> : <Circle size={8} fill="currentColor" />}
                    </span>
                    <span className="whitespace-nowrap text-xs font-bold" style={{ color: i === journeyStage ? T.accent : T.sub }}>{stage.k}</span>
                    <span className="whitespace-nowrap text-[10px]" style={{ color: T.faint }}>{stage.done}</span>
                  </div>
                  {i < JOURNEY.length - 1 && <div className="mx-1 mt-3 h-0.5 flex-1" style={{ background: i < journeyStage ? T.good : T.border }} />}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <span key={c.role} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold" style={{ background: rgba(c.c, 0.12), color: c.c }}>
                  <Circle size={6} fill="currentColor" />{c.role}
                </span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {spotlightSuppliers.map((s) => (
                <button key={s.id} onClick={() => setSelSup(s.id)} className="relative overflow-hidden rounded-xl border text-left" style={{ borderColor: T.border }}>
                  <Shot role={s.role} seed={s.id} T={T} pal={pal} h={72} />
                  {s.status !== "confirmed" && (
                    <span className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold" style={{ background: s.status === "issue" ? T.bad : T.gold, color: s.status === "issue" ? "#fff" : T.onGold }}>
                      {s.status === "issue" ? "NEEDS RESOLVING" : "WAITING ON YOU"}
                    </span>
                  )}
                  <div className="p-1.5">
                    <div className="truncate text-xs font-bold">{s.name}</div>
                    <div className="truncate text-xs" style={{ color: s.status === "confirmed" ? T.good : s.status === "issue" ? T.bad : T.warn }}>{s.status === "confirmed" ? "Confirmed" : s.status === "issue" ? "Needs resolving" : "Pending"}</div>
                  </div>
                </button>
              ))}
            </div>
            {budget.headroom < 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl p-2.5 text-xs font-semibold" style={{ background: rgba(T.gold, 0.16), color: T.warn }}>
                If you book everything at today's prices you land {fmtR(Math.abs(budget.headroom))} over — Lungi has trims ready.
                <button onClick={() => setLens("budget")} className="font-bold underline">See the trims →</button>
              </div>
            )}
          </Card>
        </div>

        {/* RAIL */}
        <div className="w-full space-y-2.5 lg:w-72 lg:shrink-0">
          {nextTasks[0] && (
            <Card T={T} style={{ background: `linear-gradient(120deg, ${T.accent}, ${rgba(T.accent, 0.75)})`, borderColor: T.accent }}>
              <div className="text-xs font-bold" style={{ color: rgba("#fff", 0.75), letterSpacing: 1 }}>COMING UP NEXT</div>
              <div className="mt-1 text-lg font-extrabold leading-tight" style={{ color: "#fff" }}>{nextTasks[0].title}</div>
              <div className="mt-1 text-xs" style={{ color: rgba("#fff", 0.85) }}>Due {nextTasks[0].due} · {nextTasks[0].owner}</div>
              <button onClick={() => setLens("week")} className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#fff", color: T.accent }}><CalendarPlus size={13} />Open in tasks</button>
            </Card>
          )}

          <Card T={T}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>NEXT UP</span>
              <button onClick={() => setLens("week")} className="text-xs font-bold" style={{ color: T.accent }}>All dates</button>
            </div>
            <div className="mt-2 space-y-2.5">
              {openTasks.slice(0, 4).map((t) => {
                const dl = dateLabel(t.due);
                return (
                  <button key={t.id} onClick={() => setLens("week")} className="flex w-full items-start gap-2.5 text-left">
                    <div className="shrink-0 rounded-lg px-2 py-1 text-center" style={{ background: T.panel2, minWidth: 40 }}>
                      <div className="text-xs font-extrabold">{dl.day}</div>
                      <div className="text-[9px] font-bold" style={{ color: T.faint }}>{dl.month.toUpperCase()}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold">{t.title}</div>
                      <div className="truncate text-[11px]" style={{ color: T.sub }}>{t.owner}</div>
                    </div>
                  </button>
                );
              })}
              {openTasks.length === 0 && <div className="py-2 text-center text-xs" style={{ color: T.faint }}>Nothing on the calendar.</div>}
            </div>
          </Card>

          <Card T={T} style={{ background: "#1A1726", borderColor: "#1A1726" }}>
            <div className="flex items-center gap-2">
              <Face seed="coach" T={T} size={26} name="Lungi Dlodlo" />
              <span className="text-xs font-bold" style={{ color: "#8F87A3", letterSpacing: 1 }}>LUNGI NOTICED</span>
            </div>
            {nudge ? (
              <>
                <div className="mt-2 text-sm font-bold leading-snug" style={{ color: "#fff" }}>{nudge.t}</div>
                <button onClick={nudge.go} className="mt-3 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: T.gold, color: T.onGold }}>Show me</button>
              </>
            ) : (
              <>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold leading-snug" style={{ color: "#fff" }}><Sparkles size={14} style={{ color: T.gold }} />{WEATHER.rain}% rain chance on the day — worth locking a marquee hold now.</div>
                <button onClick={() => setLens("stitchit")} className="mt-3 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: T.gold, color: T.onGold }}>Show me</button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
