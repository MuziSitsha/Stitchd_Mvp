import { useEffect, useState } from "react";
import { Percent } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { rgba } from "../../theme/theme";
import { supabase } from "../../lib/supabase";

interface Deal {
  id: string;
  title: string;
  description: string | null;
  discount_label: string | null;
  applicable_date: string | null;
  suppliers: { name: string; category: string } | null;
}

// Phase H's one addition to the client app — a small, additive strip
// surfacing real supplier-published promotions (supabase.promotions),
// separate from the existing mock HIRE promo grid above it, which stays
// completely untouched.
export function SupplierDealsStrip({ T }: { T: Theme }) {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from("promotions")
        .select("id, title, description, discount_label, applicable_date, suppliers(name, category)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(8);
      if (cancelled) return;
      if (error) {
        console.error("SupplierDealsStrip: failed to load promotions", error.message);
        return;
      }
      setDeals((data as unknown as Deal[]) ?? []);
    }
    load();
    const channel = supabase
      .channel("stitchit-supplier-deals")
      .on("postgres_changes", { event: "*", schema: "public", table: "promotions" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (deals.length === 0) return null;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>
        <Percent size={11} />SUPPLIER DEALS
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {deals.map((d) => (
          <div key={d.id} className="shrink-0 rounded-2xl border p-3" style={{ width: 220, borderColor: rgba(T.gold, 0.4), background: rgba(T.gold, 0.06) }}>
            <div className="text-xs font-bold" style={{ color: T.ink }}>{d.title}</div>
            <div className="mt-0.5 text-[11px]" style={{ color: T.sub }}>{d.suppliers?.name ?? "Supplier"} · {d.suppliers?.category}</div>
            {d.discount_label && <div className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: T.gold, color: T.onGold }}>{d.discount_label}</div>}
            {d.description && <div className="mt-1 text-[11px]" style={{ color: T.sub }}>{d.description}</div>}
            {d.applicable_date && (
              <div className="mt-1 text-[10px]" style={{ color: T.faint }}>
                {new Date(`${d.applicable_date}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "long" })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
