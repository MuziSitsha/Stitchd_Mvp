import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { transitionTicket } from "../lib/functions";

// Merc's own testing feedback: "the Tasks are not linked to anything, if u
// click them they just say completed when it should create a ticket... no
// dead tickets." Today/Week used to run on a plain in-memory array
// (TASKS_SEED) — this backs the exact same shape with real `tickets` rows
// (category = 'task'), so completing a task really transitions a real,
// audited ticket instead of flipping a local boolean into the void.
export interface Task {
  id: string; // the ticket's own ref (e.g. TIX-xxxxx) — stable, human-traceable key
  title: string;
  note: string;
  owner: string; // tickets.assigned_label — "whom responsible" (Merc's own phrase)
  due: string; // yyyy-mm-dd, from tickets.due_at
  pr: "low" | "medium" | "high";
  st: "todo" | "doing" | "waiting" | "done";
}

const STATUS_TO_ST: Record<string, Task["st"]> = {
  open: "todo",
  reopened: "todo",
  assigned: "todo",
  accepted: "todo",
  in_progress: "doing",
  waiting_client: "waiting",
  waiting_supplier: "waiting",
  resolved: "done",
  closed: "done",
};

let instanceCounter = 0;

export function useTasks(eventId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const instanceId = useRef(++instanceCounter);

  useEffect(() => {
    if (!eventId) {
      setTasks([]);
      return;
    }

    const load = () => {
      supabase
        .from("tickets")
        .select("ref, title, note, assigned_label, due_at, priority, status")
        .eq("event_id", eventId)
        .eq("category", "task")
        .order("due_at", { ascending: true, nullsFirst: false })
        .then(({ data, error }) => {
          if (error) {
            console.error("useTasks: failed to load tasks", error.message);
            return;
          }
          setTasks(
            (data ?? []).map((r) => ({
              id: r.ref,
              title: r.title ?? "Untitled task",
              note: r.note ?? "",
              owner: r.assigned_label ?? "You",
              due: r.due_at ? r.due_at.slice(0, 10) : "",
              pr: (r.priority === "high" || r.priority === "critical" ? "high" : r.priority === "low" ? "low" : "medium") as Task["pr"],
              st: STATUS_TO_ST[r.status] ?? "todo",
            })),
          );
        });
    };
    load();

    const channel = supabase
      .channel(`tasks:${eventId}:${instanceId.current}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `event_id=eq.${eventId}` }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  async function addTask(title: string, owner: string = "You") {
    if (!eventId) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    const { data: userRes } = await supabase.auth.getUser();
    const dueAt = new Date(Date.now() + 21 * 86400000).toISOString();
    const { error } = await supabase.from("tickets").insert({
      event_id: eventId,
      category: "task",
      visibility: "client",
      created_by: userRes.user?.id,
      created_by_role: "client",
      title: trimmed,
      assigned_label: owner,
      due_at: dueAt,
      priority: "medium",
    });
    if (error) console.error("useTasks: failed to create task", error.message);
  }

  async function completeTask(id: string, currentSt: Task["st"]) {
    const toStatus = currentSt === "done" ? "open" : "resolved";
    try {
      await transitionTicket(id, toStatus, toStatus === "resolved" ? "Marked done" : "Reopened from the task list");
    } catch (e) {
      console.error("useTasks: failed to transition task", e instanceof Error ? e.message : e);
    }
  }

  return { tasks, addTask, completeTask };
}
