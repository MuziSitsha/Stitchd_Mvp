import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type ResolvedRole = "staff" | "supplier" | "client";

// "Supplier-ness" and "client-ness" are each modeled by a row existing in a
// domain table (suppliers.profile_id / events.owner_id), not by
// role_assignments — role_assignments is reserved for internal staff
// (ops/admin/super/coach), mirroring how /supplier/* and SupplierPortal.tsx
// already gate purely on `suppliers.profile_id`, confirmed by reading those
// files rather than assumed.
export function useResolvedRole(session: Session | null) {
  const [role, setRole] = useState<ResolvedRole | null>(null);
  const [hasEvent, setHasEvent] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setRole(null);
      setHasEvent(false);
      setEventId(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      // Resolve an owned event up front — it's needed whether the person is
      // a plain client (onboarding vs. app) or a staff member who also has
      // their own wedding on the platform (Entry lands them in it rather
      // than the Ops Console).
      const { data: eventRow } = await supabase
        .from("events")
        .select("id")
        .eq("owner_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setHasEvent(!!eventRow);
      setEventId(eventRow?.id ?? null);

      const { data: staffRows } = await supabase
        .from("role_assignments")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .in("role", ["ops", "admin", "super", "coach"]);
      if (cancelled) return;
      if (staffRows && staffRows.length > 0) {
        setRole("staff");
        setLoading(false);
        return;
      }

      const { data: supplierRow } = await supabase
        .from("suppliers")
        .select("id")
        .eq("profile_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (supplierRow) {
        setRole("supplier");
        setLoading(false);
        return;
      }

      setRole("client");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  return { role, hasEvent, eventId, loading };
}
