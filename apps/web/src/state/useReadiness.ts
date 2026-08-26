import { useMemo } from "react";
import { rolesFor, weightsFor, scoreReadiness } from "../components/proto/readiness";
import { RSVP_BASE } from "../components/proto/data";
import { useProtoState } from "./ProtoState";
import { useBudget } from "./useBudget";
import type { LensKey } from "../components/proto/AppShell";

export type Suggestion = { t: string; pts: number; money?: number; go: () => void };

// Shared by Squad/Chat/Coach/Timeline: the readiness score and its ingredient
// figures (coreList/rsvp/budget) are pure derivations of the shared sup/
// gList/tasks/budgetCap/pinned state, recomputed per-lens rather than
// threaded through context as its own mutable slice.
//
// `setLens` is optional — only the Readiness Drawer needs the `sug`
// what-if-suggestion list (stitchd-v9.jsx lines 1138-1167), and building it
// needs somewhere to navigate to. Callers that only need the score itself
// (Chat, Timeline, Coach) can omit it and get an empty `sug`.
export function useReadiness(setLens?: (l: LensKey) => void) {
  const { sup, gList, tasks, profile, bundleApplied, setSelSup, applyBundle } = useProtoState();
  const { budget } = useBudget();

  const coreList = useMemo(() => sup.filter((s) => s.zone === "core"), [sup]);
  const rsvp = useMemo(() => {
    const yesSeats = gList.filter((g) => g.rsvp === "yes").reduce((a, g) => a + g.party, 0);
    const pendSeats = gList.filter((g) => g.rsvp === "pending").reduce((a, g) => a + g.party, 0);
    return {
      pend: gList.filter((g) => g.rsvp === "pending").length,
      pendSeats,
      headcount: RSVP_BASE.seats + yesSeats,
      maxcount: RSVP_BASE.seats + yesSeats + pendSeats,
    };
  }, [gList]);
  const pRoles = useMemo(() => rolesFor(profile.prior), [profile.prior]);
  const { w: WEIGHTS, why: weightWhy } = useMemo(() => weightsFor(profile.prior), [profile.prior]);
  const budgetHealth = budget.overLocked ? 40 : budget.headroom >= 0 ? 100 : 60;
  const R = useMemo(() => scoreReadiness({ sup, gList, tasks, budgetHealth, w: WEIGHTS, pRoles }), [sup, gList, tasks, budgetHealth, WEIGHTS, pRoles]);

  // Ported exactly from stitchd-v9.jsx lines 1138-1167 — a what-if simulator:
  // for each candidate action, re-run scoreReadiness with a hypothetical
  // patch applied and diff the total against the real score, so the
  // suggestion list is always ranked by actual point value, not a guess.
  const sug: Suggestion[] = useMemo(() => {
    if (!setLens) return [];
    const base = { sup, gList, tasks, budgetHealth, w: WEIGHTS, pRoles };
    const score = R.total;
    const sim = (patch: Partial<typeof base>) => scoreReadiness({ ...base, ...patch }).total - score;
    const list: Suggestion[] = [];

    sup.filter((s) => s.status === "issue").forEach((s) => {
      list.push({
        t: `Resolve ${s.name} — ${s.issueNote}`,
        pts: sim({ sup: sup.map((x) => (x.id === s.id ? { ...x, status: "confirmed" as const } : x)) }),
        go: () => setSelSup(s.id),
      });
    });
    if (rsvp.pend > 0) {
      list.push({
        t: `Chase ${rsvp.pend} outstanding RSVPs (${rsvp.pendSeats} seats)`,
        pts: sim({ gList: gList.map((g) => (g.rsvp === "pending" ? { ...g, rsvp: "yes" as const } : g)) }),
        go: () => setLens("rsvp"),
      });
    }
    const unconfCore = coreList.filter((s) => s.status !== "confirmed");
    if (unconfCore.length) {
      list.push({
        t: `Confirm ${unconfCore.length} core supplier${unconfCore.length > 1 ? "s" : ""}${unconfCore.some((s) => pRoles.has(s.role)) ? " — one is a priority role" : ""}`,
        pts: sim({ sup: sup.map((x) => (x.zone === "core" ? { ...x, status: "confirmed" as const } : x)) }),
        go: () => setLens("team"),
      });
    }
    const openT = tasks.filter((t) => t.st !== "done");
    if (openT.length) {
      list.push({
        t: `Clear ${openT.length} open task${openT.length > 1 ? "s" : ""}`,
        pts: sim({ tasks: tasks.map((t) => ({ ...t, st: "done" })) }),
        go: () => setLens("week"),
      });
    }
    if (!bundleApplied) list.push({ t: "Apply the Oakfield package (Catering + DJ + Décor) — saves R71k", pts: 0, money: 71, go: () => applyBundle() });

    return list.filter((s) => s.pts > 0 || s.money);
  }, [setLens, sup, gList, tasks, budgetHealth, WEIGHTS, pRoles, coreList, bundleApplied, rsvp.pend, rsvp.pendSeats, R.total, setSelSup, applyBundle]);

  return { coreList, rsvp, budget, pRoles, WEIGHTS, weightWhy, R, sug };
}
