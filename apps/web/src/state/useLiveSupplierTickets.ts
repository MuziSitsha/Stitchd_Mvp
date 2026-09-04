import { useEffect, useId, useState } from "react";
import { supabase } from "../lib/supabase";

export type TicketStatus = {
  id: string;
  ref: string;
  status: "pending" | "confirmed" | "declined";
  createdAt: string;
  confirmedAt: string | null;
  confirmedRole: "supplier" | "admin" | "client" | null;
};

// Sibling to useLiveSupplierStatus.ts — same name-matching + Realtime-refetch
// pattern, so a ticket created/confirmed for real (via Squad/Suppliers,
// /supplier, or /admin) shows up everywhere live. RLS on supplier_tickets
// already scopes rows per viewer (client sees their own event's tickets,
// a claimed supplier sees their own listing's tickets, admin/super sees
// all), so this one hook is reusable unmodified across all three surfaces.
export function useLiveSupplierTickets() {
  const [byName, setByName] = useState<Map<string, TicketStatus>>(new Map());
  // Unlike useLiveSupplierStatus.ts's single fixed channel name, this hook
  // is called from multiple simultaneously-mounted places (a lens page AND
  // the SupplierDrawer it can open at the same time) — a shared channel
  // name across instances makes the second .subscribe() throw ("cannot add
  // postgres_changes callbacks... after subscribe()"), so each mount gets
  // its own uniquely-named channel instead.
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("supplier_tickets")
        .select("id, ref, status, created_at, confirmed_at, confirmed_role, suppliers(name)")
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("useLiveSupplierTickets: failed to load supplier_tickets", error.message);
        return;
      }
      // Ascending order + Map overwrite-on-same-key means the most recent
      // ticket per supplier name wins, matching useLiveSupplierStatus.ts's
      // own reasoning for why this is safe without an extra sort/reduce.
      const next = new Map<string, TicketStatus>();
      for (const r of data ?? []) {
        const supplierName = (r.suppliers as unknown as { name: string } | null)?.name;
        if (!supplierName) continue;
        next.set(supplierName, {
          id: r.id,
          ref: r.ref,
          status: r.status as "pending" | "confirmed" | "declined",
          createdAt: r.created_at,
          confirmedAt: r.confirmed_at,
          confirmedRole: r.confirmed_role as "supplier" | "admin" | "client" | null,
        });
      }
      setByName(next);
    }

    load();

    const channel = supabase
      .channel(`live-supplier-tickets-${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "supplier_tickets" }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [instanceId]);

  return byName;
}
