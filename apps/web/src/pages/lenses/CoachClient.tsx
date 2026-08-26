import { useMemo, useState } from "react";
import { X, Clock } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Face } from "../../components/proto/Face";
import { useReadiness } from "../../state/useReadiness";
import { useProtoState } from "../../state/ProtoState";
import { LESSONS_SEED } from "../../components/proto/data";
import type { Theme } from "../../theme/theme";

const barColor = (T: Theme, pct: number) => (pct >= 80 ? T.good : pct >= 55 ? T.gold : T.bad);

function LessonSheet({ T, lesson, onClose }: { T: Theme; lesson: (typeof LESSONS_SEED)[number]; onClose: () => void }) {
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0" style={{ background: "rgba(5,5,10,0.65)" }} onClick={onClose} />
      <div className="rise relative w-full max-w-lg rounded-t-3xl border p-5 sm:rounded-3xl" style={{ background: T.panel, borderColor: T.border, maxHeight: "85vh", overflowY: "auto" }}>
        <div className="mb-1 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.faint }}><Clock size={11} />{lesson.mins}</div>
            <div className="mt-0.5 text-lg font-extrabold leading-snug">{lesson.title}</div>
          </div>
          <button aria-label="Close" onClick={onClose} className="shrink-0 rounded-lg p-1.5" style={btnG}><X size={15} /></button>
        </div>
        <div className="mt-3 space-y-3 text-sm leading-relaxed" style={{ color: T.ink }}>
          {lesson.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="mt-4 text-xs" style={{ color: T.faint }}>— Lungi Dlodlo</div>
      </div>
    </div>
  );
}

// R.parts' own labels (readiness.ts) are checklist-style ("No open supplier
// issues") — fine standalone, but read as a double negative dropped into
// "___ is what's holding your score back." This maps each part to a plain
// area noun for that one sentence only, without touching the shared labels
// the Readiness Drawer/Squad also render.
const AREA_NOUN: Record<string, string> = {
  core: "Your core squad",
  rsvp: "RSVPs",
  tasks: "Your task list",
  budget: "Your budget",
  risk: "An open supplier issue",
};

// Us > Coach — client-facing readiness-by-area view. Distinct from the
// existing staff-facing Coach.tsx (book-of-work dashboard for Lungi's whole
// client list) — this one is the couple's own read of the same live
// readiness score (useReadiness's R.parts), not a second fabricated metric.
export function CoachClient() {
  const { T } = useTheme();
  const { sup, toast } = useProtoState();
  const { R } = useReadiness();
  const [openLesson, setOpenLesson] = useState<number | null>(null);

  const lowest = useMemo(() => [...R.parts].sort((a, b) => a.pct - b.pct)[0], [R.parts]);
  const issue = sup.find((s) => s.status === "issue");
  const confirmedCount = sup.filter((s) => s.status === "confirmed").length;

  return (
    <div className="rise grid gap-3 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <Card T={T}>
          <div className="mb-1 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>THIS WEEK'S FOCUS</div>
          <div className="text-xl font-extrabold leading-snug">{AREA_NOUN[lowest.k] ?? lowest.l} is what's holding your score back — it's worth ten minutes before anything else.</div>
          <div className="mt-1.5 text-xs" style={{ color: T.sub }}>{lowest.detail}. Close that and the rest of your plan moves easier, because every other decision stops waiting on it.</div>
        </Card>

        <Card T={T}>
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-sm font-bold">How ready you are, area by area</div>
            <span className="text-xs font-bold" style={{ color: T.good }}>{R.total}% overall</span>
          </div>
          <div className="space-y-3">
            {R.parts.map((p) => (
              <div key={p.k} className="flex items-center gap-3">
                <span className="w-[124px] shrink-0 text-xs font-bold">{p.l}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: T.panel2 }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, p.pct)}%`, background: barColor(T, p.pct) }} />
                </div>
                <span className="tnum w-10 shrink-0 text-right text-xs font-bold">{p.pct}%</span>
                <span className="hidden w-[170px] shrink-0 truncate text-[11px] sm:block" style={{ color: T.faint }}>{p.detail}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-2">
          <div className="text-sm font-bold">Worth ten minutes this week</div>
          {LESSONS_SEED.map((l, i) => (
            <div key={l.title} className="flex items-center gap-3 rounded-2xl border p-3.5" style={{ borderColor: T.border, background: T.panel }}>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{l.title}</div>
                <div className="text-xs" style={{ color: T.sub }}>{l.note}</div>
              </div>
              <span className="shrink-0 text-xs font-bold" style={{ color: T.faint }}>{l.mins}</span>
              <button onClick={() => setOpenLesson(i)} className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: T.panel2 }}>Read</button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl p-4" style={{ background: "#1A1726" }}>
          <div className="flex items-center gap-2">
            <Face seed="coach" T={T} size={30} />
            <span className="text-xs font-bold" style={{ color: "#8F87A3", letterSpacing: 1 }}>YOUR CHECK-IN</span>
          </div>
          <div className="mt-2 text-sm font-bold leading-snug" style={{ color: "#F7F5FB" }}>
            {issue ? `Last flag: ${issue.name} — ${issue.issueNote}. Still open, or did it resolve?` : "Nothing open on my end right now — anything on your mind before next week?"}
          </div>
          {issue && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => toast(`Noted — I'll check ${issue.name} shows resolved`, "good")} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: T.gold, color: T.onGold }}>Yes, it's set</button>
              <button onClick={() => toast("Noted — I'll flag it again next week", "warn")} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: rgba("#fff", 0.1), color: "#F7F5FB" }}>Still tense</button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-4" style={{ borderColor: rgba(T.good, 0.3), background: rgba(T.good, 0.1) }}>
          <div className="text-xs font-bold" style={{ color: T.good, letterSpacing: 1 }}>YOU'RE DOING BETTER THAN YOU THINK</div>
          <div className="mt-1.5 text-xs leading-relaxed" style={{ color: T.ink }}>{confirmedCount} suppliers confirmed already, with months still on the clock. Most Gauteng couples aren't there yet at this point.</div>
        </div>

        <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: T.panel }}>
          <div className="text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>COMING INTO VIEW</div>
          <div className="mt-1.5 text-xs leading-relaxed" style={{ color: T.sub }}>Closer to the day the work changes shape — seating, the run sheet, and a hundred small confirmations. I'll start surfacing those instead of quotes.</div>
        </div>
      </div>

      {openLesson !== null && <LessonSheet T={T} lesson={LESSONS_SEED[openLesson]} onClose={() => setOpenLesson(null)} />}
    </div>
  );
}
