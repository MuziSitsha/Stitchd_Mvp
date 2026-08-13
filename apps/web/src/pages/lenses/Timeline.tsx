import { CheckCircle2, Heart, ArrowRight } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { DAYS_LEFT, type Supplier } from "../../components/proto/data";
import { useProtoState, type Task } from "../../state/ProtoState";
import { useReadiness } from "../../state/useReadiness";
import type { LensKey } from "../../components/proto/AppShell";

const WEATHER_RAIN = 55;

type MilestoneCtx = { coreList: Supplier[]; rsvp: { pend: number; pendSeats: number; headcount: number; maxcount: number }; tasks: Task[]; sup: Supplier[]; guests: number; bundleApplied: boolean };
const MILESTONES: { when: string; t: string; go?: LensKey; cta?: string; check: (ctx: MilestoneCtx) => { done: boolean; detail: string } }[] = [
  { when: "12 months out", t: "Venue + date locked", check: () => ({ done: true, detail: "Oakfield Farm confirmed for 14 Nov 2026." }) },
  {
    when: "9 months out", t: "Core squad secured", go: "squad", cta: "Open squad",
    check: ({ coreList }) => {
      const c = coreList.filter((s) => s.status === "confirmed").length;
      return { done: c === coreList.length, detail: `${c}/${coreList.length} core suppliers confirmed.` };
    },
  },
  {
    when: "6 months out", t: "Invites out, attire underway", go: "tasks", cta: "Open tasks",
    check: ({ tasks }) => {
      const inv = tasks.find((t) => /invite/i.test(t.title));
      return { done: inv ? inv.st === "done" : false, detail: inv && inv.st !== "done" ? "Remaining invites still to send." : "All invites out." };
    },
  },
  {
    when: "3 months out", t: "RSVPs closed, seating v1, shuttle locked", go: "rsvp", cta: "Chase RSVPs",
    check: ({ rsvp }) => ({ done: rsvp.pend === 0, detail: rsvp.pend ? `${rsvp.pend} households outstanding · ${rsvp.pendSeats} seats.` : "Every household has replied." }),
  },
  {
    when: "1 month out", t: "Final numbers, payment run, run sheet", go: "budget", cta: "Open budget",
    check: ({ rsvp, guests }) => ({ done: rsvp.pend === 0 && rsvp.maxcount <= guests, detail: `Caterer needs a final number — currently ${rsvp.headcount} confirmed, worst case ${rsvp.maxcount}.` }),
  },
  {
    when: "2 weeks out", t: "Rehearsal, vendor call-round, weather call", go: "squad", cta: "Review squad",
    check: ({ sup, bundleApplied }) => ({ done: false, detail: `${sup.filter((s) => s.status === "issue").length} open supplier issue(s) · ${WEATHER_RAIN}% rain forecast${bundleApplied ? " · package locked" : ""}.` }),
  },
  { when: "Wedding day", t: "Breathe. Lungi runs the day.", check: () => ({ done: false, detail: "Run sheet issues to every supplier 48 hours before." }) },
];

// Ported exactly from stitchd-v9.jsx lines 2470-2491.
export function Timeline({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T } = useTheme();
  const { sup, tasks, bundleApplied, guests } = useProtoState();
  const { coreList, rsvp } = useReadiness();

  const ctx: MilestoneCtx = { coreList, rsvp, tasks, sup, guests, bundleApplied };

  return (
    <div className="rise">
      <div className="mb-3 text-sm" style={{ color: T.sub }}>The road to 14 November — {DAYS_LEFT} days out. Each stage reads your actual board, so it moves as you work.</div>
      {MILESTONES.map((m, i) => {
        const st = m.check(ctx);
        const isNow = !st.done && MILESTONES.slice(0, i).every((x) => x.check(ctx).done);
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: st.done ? T.good : isNow ? T.accent : "transparent", border: st.done || isNow ? "none" : `2px dashed ${T.faint}` }}>
                {st.done && <CheckCircle2 size={13} style={{ color: "#fff" }} />}
                {isNow && <Heart size={11} style={{ color: T.onAccent }} />}
              </span>
              {i < MILESTONES.length - 1 && <span className="w-px flex-1" style={{ backgroundImage: `repeating-linear-gradient(180deg, ${rgba(T.gold, 0.5)} 0 6px, transparent 6px 12px)` }} />}
            </div>
            <Card T={T} className="mb-3 flex-1" style={isNow ? { borderColor: rgba(T.accent, 0.6) } : {}}>
              <div className="text-xs font-bold" style={{ color: st.done ? T.good : isNow ? T.accent : T.faint, letterSpacing: 1 }}>{m.when.toUpperCase()}{isNow ? " · YOU ARE HERE" : ""}</div>
              <div className="text-sm font-semibold" style={{ opacity: st.done ? 0.65 : 1 }}>{m.t}</div>
              {st.detail && <div className="mt-1 text-xs" style={{ color: st.done ? T.good : T.sub }}>{st.detail}</div>}
              {!st.done && m.go && <button onClick={() => setLens(m.go!)} className="mt-2 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ background: T.accent, color: T.onAccent }}>{m.cta} <ArrowRight size={12} /></button>}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
