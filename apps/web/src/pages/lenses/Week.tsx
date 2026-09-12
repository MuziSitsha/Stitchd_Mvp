import { useMemo, useState } from "react";
import { Plus, Circle, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { useProtoState } from "../../state/ProtoState";

const TODAY = new Date();
const days = (iso: string) => Math.ceil((new Date(iso).getTime() - TODAY.getTime()) / 86400000);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const COLUMNS = [
  { key: "week", label: "This week", test: (d: number) => d <= 7 },
  { key: "month", label: "This month", test: (d: number) => d > 7 && d <= 30 },
  { key: "before", label: "Before the day", test: (d: number) => d > 30 },
] as const;

// "All tasks" — the Today tab's second sub-screen: a time-horizon board over
// the same `tasks` state/actions, restyled to match the reference's
// checkbox-card pattern (empty circle -> tick, note line, date + owner chip)
// instead of the earlier severity-dot/overdue-badge treatment.
const ASSIGNEES = ["You", "Junior", "Nadine", "Both"];

export function Week() {
  const { T } = useTheme();
  const { tasks, addTask: addTaskReal, completeTask, toast } = useProtoState();
  const [newTask, setNewTask] = useState("");
  const [newOwner, setNewOwner] = useState(ASSIGNEES[0]);

  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  const open = useMemo(() => tasks.filter((t) => t.st !== "done"), [tasks]);
  const owners = useMemo(() => {
    const m = new Map<string, number>();
    open.forEach((t) => m.set(t.owner, (m.get(t.owner) ?? 0) + 1));
    return [...m.entries()];
  }, [open]);
  const waiting = tasks.filter((t) => t.st === "waiting").length;

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    addTaskReal(title, newOwner);
    setNewTask("");
    toast(`Task added for ${newOwner} · a real ticket, not just a note`);
  }
  function complete(id: string) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    toast(t.st === "done" ? `"${t.title}" reopened` : `"${t.title}" done`, t.st === "done" ? "warn" : undefined);
    completeTask(id, t.st);
  }

  return (
    <div className="rise space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border p-3.5" style={{ borderColor: T.border, background: T.panel }}>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>DONE</span>
          <span className="text-lg font-extrabold">{tasks.filter((t) => t.st === "done").length} of {tasks.length}</span>
        </div>
        <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.1) }}>
          <div className="h-full rounded-full" style={{ width: `${Math.round((tasks.filter((t) => t.st === "done").length / tasks.length) * 100)}%`, background: T.good }} />
        </div>
        {owners.map(([owner, n]) => (
          <span key={owner} className="text-xs" style={{ color: T.sub }}>{owner} <b style={{ color: T.ink }}>{n} open</b></span>
        ))}
        {waiting > 0 && <span className="text-xs" style={{ color: T.sub }}>Waiting on suppliers <b style={{ color: T.warn }}>{waiting}</b></span>}
        <div className="ml-auto flex gap-2">
          <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Add a task…" className="min-w-0 rounded-lg px-3 py-1.5 text-xs outline-none" style={inputS} />
          <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)} aria-label="Who's responsible" className="rounded-lg px-2 py-1.5 text-xs outline-none" style={inputS}>
            {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={addTask} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "#1A1726", color: "#fff" }}><Plus size={12} />Add</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = open.filter((t) => col.test(days(t.due))).sort((a, b) => a.due.localeCompare(b.due));
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2 px-1 text-xs font-bold" style={{ color: T.sub, letterSpacing: 1 }}>
                {col.label.toUpperCase()}<span className="rounded-full px-1.5" style={{ background: T.panel2 }}>{colTasks.length}</span>
              </div>
              {colTasks.map((t) => {
                const d = new Date(t.due);
                const od = d < TODAY;
                const dateLabel = od ? "overdue" : `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
                const dateColor = od ? T.bad : col.key === "week" ? T.bad : col.key === "month" ? T.warn : T.faint;
                return (
                  <button key={t.id} onClick={() => complete(t.id)} className="flex w-full items-start gap-2.5 rounded-xl border p-3 text-left" style={{ background: T.panel, borderColor: od ? rgba(T.bad, 0.4) : T.border }}>
                    <Circle size={16} className="mt-0.5 shrink-0" style={{ color: T.faint }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold leading-snug">{t.title}</div>
                      {t.note && <div className="mt-0.5 text-xs leading-snug" style={{ color: T.sub }}>{t.note}</div>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: rgba(dateColor, 0.14), color: dateColor }}>{dateLabel}</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: T.panel2, color: T.sub }}>{t.owner}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {colTasks.length === 0 && <div className="rounded-xl border border-dashed py-4 text-center text-xs" style={{ borderColor: T.border, color: T.faint }}>Nothing here</div>}
            </div>
          );
        })}
      </div>

      {tasks.filter((t) => t.st === "done").length > 0 && (
        <details className="rounded-2xl border" style={{ borderColor: T.border, background: T.panel }}>
          <summary className="cursor-pointer px-4 py-2.5 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>DONE · {tasks.filter((t) => t.st === "done").length}</summary>
          <div className="space-y-2 p-3 pt-0">
            {tasks.filter((t) => t.st === "done").map((t) => (
              <button key={t.id} onClick={() => complete(t.id)} className="flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left" style={{ background: T.panel2, borderColor: T.border, opacity: 0.75 }}>
                <CheckCircle2 size={15} className="shrink-0" style={{ color: T.good }} />
                <div className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ textDecoration: "line-through" }}>{t.title}</div>
                <span className="shrink-0 text-[10px] font-semibold" style={{ color: T.faint }}>{t.owner}</span>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
