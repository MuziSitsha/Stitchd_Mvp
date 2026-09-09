import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

// Real reconciliation for Money > Budget/Payments. BUDGET_ITEMS is static
// demo data (no real "budget line item" table exists, deliberately — the
// demo narrative stays put), but "Pay now" fires a genuine Paystack
// checkout via checkoutBudgetPayment, and the webhook genuinely marks that
// row 'paid' in budget_payments. Without this, a client who actually pays
// sees their own app still list it as outstanding forever. Correlates by
// label — the same string checkoutBudgetPayment sends (the part of a
// BUDGET_ITEM's own label after "Supplier — ") — since that's the only key
// the two sides share.
// Called from several places at once (Today's readiness score, Budget,
// Payments) — each mount needs its own realtime channel, since Supabase
// realtime rejects a second subscription reusing a channel name that's
// already subscribed. instanceId keeps every mount's channel name unique.
let instanceCounter = 0;

export function useBudgetPayments(eventId: string | null) {
  const [paidLabels, setPaidLabels] = useState<Set<string>>(new Set());
  const instanceId = useRef(++instanceCounter);

  useEffect(() => {
    if (!eventId) { setPaidLabels(new Set()); return; }

    const load = () => {
      supabase
        .from("budget_payments")
        .select("label")
        .eq("event_id", eventId)
        .eq("status", "paid")
        .then(({ data }) => setPaidLabels(new Set((data ?? []).map((r) => r.label))));
    };
    load();

    const channel = supabase
      .channel(`budget-payments:${eventId}:${instanceId.current}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "budget_payments", filter: `event_id=eq.${eventId}` }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  return paidLabels;
}
