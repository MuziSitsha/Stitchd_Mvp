import { useMemo, useState } from "react";
import { AlertTriangle, Wallet } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { fmtR } from "../../components/proto/data";
import { useBudget } from "../../state/useBudget";
import { useProtoState } from "../../state/ProtoState";
import { checkoutBudgetPayment, friendlyPaymentError } from "../../lib/functions";
import type { LensKey } from "../../components/proto/AppShell";

// Money > Payments — a forward-looking schedule, distinct from Budget's
// category rollups. Derived from the real unpaid BUDGET_ITEMS (no separate
// due-date field exists on them, so this orders by cost — largest/most
// urgent-reading commitments first — rather than inventing fake dates).
export function Payments({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T } = useTheme();
  const { BUDGET_ITEMS, budget } = useBudget();
  const { toast } = useProtoState();
  const [payingId, setPayingId] = useState<string | null>(null);

  const schedule = useMemo(
    () => BUDGET_ITEMS.filter((b) => !b.paid && budget.kept.has(b.id)).sort((a, b) => b.cost - a.cost),
    [BUDGET_ITEMS, budget.kept],
  );
  const nextUp = schedule[0];
  const totalDue = schedule.reduce((a, b) => a + b.cost, 0);
  const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };

  // BUDGET_ITEMS' cost is in thousands of Rand (data.ts's fmtR convention) —
  // ×1000 for Rand, ×100 again for the cents Paystack's API expects.
  async function payItem(id: string, label: string, costK: number) {
    setPayingId(id);
    try {
      const checkout = await checkoutBudgetPayment(label.replace(/^[^—]*—\s*/, ""), Math.round(costK * 100000));
      window.location.href = checkout.checkout_url;
    } catch (e) {
      toast(friendlyPaymentError(e), "warn");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="rise space-y-3">
      {nextUp && (
        <div className="rounded-2xl border p-4" style={{ borderColor: T.accent, background: `linear-gradient(120deg, ${T.accent}, ${rgba(T.accent, 0.7)})` }}>
          <div className="text-xs font-bold" style={{ color: rgba("#fff", 0.8), letterSpacing: 1 }}>NEXT DUE</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span style={{ ...bigNum, fontSize: 30, color: "#fff" }}>{fmtR(nextUp.cost)}</span>
            <span className="text-sm" style={{ color: rgba("#fff", 0.85) }}>{nextUp.label}</span>
          </div>
          <button onClick={() => setLens("budget")} className="mt-3 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#fff", color: T.accent }}>Open in Budget</button>
        </div>
      )}

      {/* 2-up card grid, not a single tall list — 11 outstanding items in
          one column was most of a screen's worth of scroll on its own. */}
      <div className="grid gap-2 sm:grid-cols-2">
        {schedule.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-2 rounded-2xl border p-3" style={{ borderColor: T.border, background: T.panel }}>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{b.label}</div>
              <div className="tnum text-sm font-bold">{fmtR(b.cost)}</div>
            </div>
            <button
              onClick={() => payItem(b.id, b.label, b.cost)}
              disabled={payingId === b.id}
              className="press shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold"
              style={{ background: "#1A1726", color: "#fff", opacity: payingId === b.id ? 0.6 : 1 }}
            >
              {payingId === b.id ? "Working…" : "Pay now"}
            </button>
          </div>
        ))}
        {schedule.length === 0 && <div className="col-span-full py-8 text-center text-xs" style={{ color: T.faint }}>Nothing scheduled — everything's paid or deferred.</div>}
      </div>

      <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: "#1A1726" }}>
        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#F2C14E", letterSpacing: 1 }}><Wallet size={13} />CAN YOU AFFORD THE MONTHS AHEAD?</div>
        <div className="mt-1 text-2xl font-extrabold" style={{ color: "#fff" }}>{fmtR(totalDue)}</div>
        <div className="text-xs" style={{ color: rgba("#fff", 0.7) }}>still to pay on what's currently committed.</div>
        {budget.headroom < 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#F0644C" }}><AlertTriangle size={12} />You're over your cap — see Budget for what to trim.</div>
        )}
      </div>
    </div>
  );
}
