// Ported exactly from stitchd-v9.jsx lines 408-453.
import type { Supplier } from "./data";

export const PRIORITY_MAP: Record<string, { roles: string[]; cats: string[] }> = {
  Budget: { roles: [], cats: [] },
  "Food & Catering": { roles: ["Catering"], cats: ["Catering"] },
  "Guest Experience": { roles: ["Transport", "MC", "Cake"], cats: ["Transport", "Extras"] },
  Venue: { roles: ["Venue"], cats: ["Venue"] },
  Photography: { roles: ["Photography", "Videography"], cats: ["Photo", "Video"] },
  "Music & Entertainment": { roles: ["Entertainment", "MC"], cats: ["Music"] },
  "Décor & Flowers": { roles: ["Florals", "Décor"], cats: ["Florals"] },
  "Traditions & Customs": { roles: ["MC", "Décor"], cats: ["Extras"] },
  "Punctuality & Timing": { roles: ["Planner", "Transport"], cats: ["Planner"] },
  Sustainability: { roles: ["Florals", "Catering"], cats: [] },
};

export const rolesFor = (prior: Set<string>) => {
  const s = new Set<string>();
  prior.forEach((p) => (PRIORITY_MAP[p]?.roles || []).forEach((r) => s.add(r)));
  return s;
};
export const catsFor = (prior: Set<string>) => {
  const s = new Set<string>();
  prior.forEach((p) => (PRIORITY_MAP[p]?.cats || []).forEach((r) => s.add(r)));
  return s;
};

const BASE_W = { core: 30, rsvp: 25, tasks: 18, budget: 12, risk: 15 };
export function weightsFor(prior: Set<string>) {
  const w = { ...BASE_W };
  const why: string[] = [];
  if (prior.has("Budget")) { w.budget += 5; w.tasks -= 5; why.push("Budget priority → budget health worth 17, tasks 13"); }
  if (prior.has("Guest Experience")) { w.rsvp += 4; w.tasks -= 4; why.push("Guest Experience priority → RSVPs worth 29"); }
  if (prior.has("Punctuality & Timing")) { w.tasks += 4; w.risk -= 4; why.push("Punctuality priority → tasks worth more"); }
  return { w, why };
}

interface Task { st: string }
interface Guest { party: number; rsvp: string }

export function scoreReadiness({
  sup, gList, tasks, budgetHealth, w, pRoles,
}: {
  sup: Supplier[]; gList: Guest[]; tasks: Task[]; budgetHealth: number;
  w: typeof BASE_W; pRoles: Set<string>;
}) {
  const core = sup.filter((s) => s.zone === "core");
  const wt = (s: Supplier) => (pRoles.has(s.role) ? 2 : 1);
  const den = core.reduce((a, s) => a + wt(s), 0) || 1;
  const num = core.filter((s) => s.status === "confirmed").reduce((a, s) => a + wt(s), 0);
  const corePct = Math.round((num / den) * 100);
  const seats = gList.reduce((a, g) => a + g.party, 0) || 1;
  const replied = gList.filter((g) => g.rsvp !== "pending").reduce((a, g) => a + g.party, 0);
  const rsvpPct = Math.round((replied / seats) * 100);
  const taskPct = Math.round((tasks.filter((t) => t.st === "done").length / (tasks.length || 1)) * 100);
  const issues = sup.filter((s) => s.status === "issue").length;
  const riskPct = Math.max(0, 100 - issues * 40);
  const parts = [
    { k: "core", l: "Core squad confirmed", pct: corePct, w: w.core, detail: `${core.filter((s) => s.status === "confirmed").length}/${core.length} confirmed${pRoles.size ? " · priority roles count double" : ""}` },
    { k: "rsvp", l: "RSVPs replied", pct: rsvpPct, w: w.rsvp, detail: `${replied}/${seats} seats answered` },
    { k: "tasks", l: "Tasks done", pct: taskPct, w: w.tasks, detail: `${tasks.filter((t) => t.st === "done").length}/${tasks.length} complete` },
    { k: "budget", l: "Budget health", pct: budgetHealth, w: w.budget, detail: budgetHealth === 100 ? "inside cap" : budgetHealth >= 60 ? "tight" : "locked costs exceed cap" },
    { k: "risk", l: "No open supplier issues", pct: riskPct, w: w.risk, detail: issues ? `${issues} unresolved issue${issues > 1 ? "s" : ""}` : "all clear" },
  ];
  const total = Math.round(parts.reduce((a, p) => a + (p.pct * p.w) / 100, 0));
  return { total, parts, corePct, rsvpPct, taskPct, riskPct, issues };
}
