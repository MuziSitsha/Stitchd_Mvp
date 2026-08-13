import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type LiveSupplierStatus = { verified: boolean; featured: boolean };

// Closes the "upsell loop" gap: the prototype's supplier cast (SUPPLIERS_SEED)
// is name-for-name the same roster seeded into the real Supabase suppliers
// table, so a Boost/Verify action taken for real in the Supplier Portal can
// be reflected here by matching on name — no shared foreign key needed.
// Real-time subscribed so a live Boost purchase (webhooks-paystack marking
// a boost "active") shows up on the client grid without a refresh, which is
// the actual demo moment FR-RANK-01 describes.
export function useLiveSupplierStatus() {
  const [byName, setByName] = useState<Map<string, LiveSupplierStatus>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase.from("supplier_ranking").select("name, verified, featured");
      if (cancelled) return;
      if (error) {
        console.error("useLiveSupplierStatus: failed to load supplier_ranking", error.message);
        return;
      }
      setByName(new Map((data ?? []).map((r) => [r.name, { verified: r.verified, featured: r.featured }])));
    }

    load();

    const channel = supabase
      .channel("client-supplier-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "suppliers" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "boosts" }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return byName;
}
