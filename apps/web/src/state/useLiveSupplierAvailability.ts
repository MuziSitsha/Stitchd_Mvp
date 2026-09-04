import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type AvailabilityStatus = "blocked" | "promo";

// Closes the audit gap: supplier_availability (a supplier's own block/promo
// calendar) was read in exactly one file — their own portal. RLS already
// permits this read (supplier_availability_select_all), so this is purely a
// missing client-side surface. Same name-keyed join idiom as
// useLiveSupplierStatus.ts — the client app's roster has no shared foreign
// key into the real suppliers table, only a matching display name.
export function useLiveSupplierAvailability(dateStr: string | null) {
  const [byName, setByName] = useState<Map<string, AvailabilityStatus>>(new Map());

  useEffect(() => {
    if (!dateStr) {
      setByName(new Map());
      return;
    }
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("supplier_availability")
        .select("status, suppliers(name)")
        .eq("date", dateStr)
        .neq("status", "open");
      if (cancelled) return;
      if (error) {
        console.error("useLiveSupplierAvailability: failed to load supplier_availability", error.message);
        return;
      }
      const next = new Map<string, AvailabilityStatus>();
      for (const r of data ?? []) {
        const supplierName = (r.suppliers as unknown as { name: string } | null)?.name;
        if (!supplierName) continue;
        next.set(supplierName, r.status as AvailabilityStatus);
      }
      setByName(next);
    }

    load();

    const channel = supabase
      .channel(`client-supplier-availability-${dateStr}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "supplier_availability" }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [dateStr]);

  return byName;
}
