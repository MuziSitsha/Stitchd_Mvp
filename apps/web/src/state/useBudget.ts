import { useMemo } from "react";
import { catsFor } from "../components/proto/readiness";
import { BUDGET_SEED } from "../components/proto/data";
import { useProtoState } from "./ProtoState";

export type BudgetItem = (typeof BUDGET_SEED)[number] & { boosted?: true };

// Shared by Squad/Budget/useReadiness (stitchd-v9.jsx lines 1078, 1093-1102):
// the source computes BUDGET_ITEMS and the optimizer's `budget` exactly once
// at the top of App() and everything downstream reads that one value. The
// port had drifted into three independent re-implementations that had each
// silently lost a different piece (Squad's copy ignored pinned items,
// Budget's copy ignored the priority need-boost and the bundle saving,
// useReadiness's copy ignored both) — pulling the calculation back into one
// hook is what keeps them from re-diverging.
export function useBudget() {
  const { budgetCap, pinned, extraBudgetItems, bundleApplied, profile } = useProtoState();
  const pCats = useMemo(() => catsFor(profile.prior), [profile.prior]);
  const BUDGET_ITEMS: BudgetItem[] = useMemo(
    () => [...BUDGET_SEED, ...extraBudgetItems].map((b) => (pCats.has(b.cat) ? { ...b, need: Math.min(10, b.need + 2), boosted: true as const } : b)),
    [pCats, extraBudgetItems],
  );

  const budget = useMemo(() => {
    const locked = BUDGET_ITEMS.filter((b) => b.paid || pinned.has(b.id));
    const flex = BUDGET_ITEMS.filter((b) => !b.paid && !pinned.has(b.id)).sort((a, b) => b.need - a.need || a.cost - b.cost);
    let sum = locked.reduce((s, b) => s + b.cost, 0);
    const kept = new Set(locked.map((b) => b.id));
    for (const b of flex) if (sum + b.cost <= budgetCap) { kept.add(b.id); sum += b.cost; }
    const dropped = BUDGET_ITEMS.filter((b) => !kept.has(b.id));
    const saving = bundleApplied ? 71 : 0;
    return {
      kept,
      dropped,
      keptSum: sum - saving,
      headroom: budgetCap - (sum - saving),
      overLocked: locked.reduce((s, b) => s + b.cost, 0) > budgetCap,
      saving,
    };
  }, [budgetCap, pinned, bundleApplied, BUDGET_ITEMS]);

  return { BUDGET_ITEMS, budget, pCats };
}
