import { useState } from "react";
import { Plus, Clock } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Chip } from "../../components/proto/Chip";
import { SEV, T_COLS } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";

const TODAY = new Date();

// Ported exactly from stitchd-v9.jsx lines 2451-2467.
export function Tasks() {
  const { T } = useTheme();
  const { tasks, setTasks, toast } = useProtoState();
  const [newTask, setNewTask] = useState("");

  const btnA = { background: T.accent, color: T.onAccent };
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    setTasks((ts) => [{ id: `t${Date.now()}`, title, owner: "You", due: "2026-09-15", pr: "medium", st: "todo" }, ...ts]);
    setNewTask("");
    toast("Task added · readiness recalculated");
  }
  function moveTask(id: string) {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const order = ["todo", "doing", "waiting", "done"];
    const nx = order[order.indexOf(t.st) === 3 ? 0 : order.indexOf(t.st) + 1];
    if (nx === "done") toast(`"${t.title}" done`);
    else if (t.st === "done") toast(`"${t.title}" reopened`, "warn");
    setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, st: nx } : x)));
  }

  return (
    <div className="space-y-3 rise">
      <div className="flex gap-2">
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Add a task…" className="min-w-0 flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={inputS} />
        <button onClick={addTask} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold" style={btnA}><Plus size={14} />Add</button>
      </div>
      <div className="text-sm" style={{ color: T.sub }}>{tasks.filter((t) => t.st === "done").length}/{tasks.length} done · tap to advance, tap a done task to reopen</div>
      <div className="grid gap-3">
        {T_COLS.map(([key, label]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2 px-1 text-xs font-bold" style={{ color: key === "done" ? T.good : T.sub, letterSpacing: 1 }}>
              {label.toUpperCase()}<span className="rounded-full px-1.5" style={{ background: T.panel2 }}>{tasks.filter((t) => t.st === key).length}</span>
            </div>
            {tasks.filter((t) => t.st === key).map((t) => {
              const od = t.st !== "done" && new Date(t.due) < TODAY;
              return (
                <button key={t.id} onClick={() => moveTask(t.id)} className="block w-full rounded-xl border p-3 text-left" style={{ background: T.panel, borderColor: od ? rgba(T.bad, 0.5) : T.border, opacity: t.st === "done" ? 0.6 : 1 }}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: SEV[t.pr as keyof typeof SEV] }} />
                    {od && <Chip c={T.bad} T={T}>overdue</Chip>}
                  </div>
                  <div className="text-sm font-semibold" style={{ textDecoration: t.st === "done" ? "line-through" : "none" }}>{t.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: T.sub }}>
                    {t.owner}<span className="ml-auto flex items-center gap-1" style={{ color: od ? T.bad : T.sub }}><Clock size={10} />{t.due.slice(5)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
