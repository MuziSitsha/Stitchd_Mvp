import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Real Stitched+ status, replacing the local `subscriber` boolean StitchIt.tsx
// used to fake — reads the caller's own subscribers row (RLS-scoped), kept
// live so a real Paystack checkout completing (via the subscription.create
// webhook) flips this without a refresh, same real-time idiom as
// useLiveSupplierStatus.ts.
export function useLiveSubscription() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user || cancelled) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("subscribers")
        .select("status")
        .eq("user_id", userRes.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("useLiveSubscription: failed to load subscribers", error.message);
      } else {
        setActive(data?.status === "active");
      }
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("client-stitched-plus")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscribers" }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { active, loading };
}
