import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Check } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { supabase } from "../lib/supabase";
import { PortalShell, PortalCard } from "../components/PortalShell";

interface UnclaimedSupplier {
  id: string;
  category: string;
  name: string;
  headline: string | null;
}

// Shared with SupplierOnboarding.tsx — one real taxonomy, not two lists that
// can quietly drift apart.
export const CATEGORIES = [
  "Cake", "Catering", "Décor Supplier", "Entertainment", "Flower Specialist",
  "Hair & Makeup", "MC", "Photography", "Planner", "Tailor",
  "Tent & Weather", "Transport", "Venue", "Videography",
];

export function SupplierClaim() {
  const { T } = useTheme();
  const [suppliers, setSuppliers] = useState<UnclaimedSupplier[]>([]);
  const [query, setQuery] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("suppliers")
      .select("id, category, name, headline")
      .is("profile_id", null)
      .order("category")
      .then(({ data, error: fetchError }) => {
        if (fetchError) setError(fetchError.message);
        else setSuppliers(data ?? []);
      });
  }, []);

  // A signed-in supplier who already claimed a listing has no business
  // being on this page at all — claiming or creating a second one is
  // exactly the double-claim bug that silently broke .maybeSingle() lookups
  // twice already this session, now also structurally blocked by a real DB
  // constraint (suppliers_profile_id_unique), but there's no reason to let
  // someone walk into that error in the first place.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("suppliers")
        .select("id")
        .eq("profile_id", data.user.id)
        .maybeSingle()
        .then(({ data: existing }) => {
          if (existing) navigate("/supplier", { replace: true });
        });
    });
  }, [navigate]);

  async function claim(id: string) {
    setClaiming(id);
    setError(null);
    const { data: userRes } = await supabase.auth.getUser();
    const { error: claimError } = await supabase
      .from("suppliers")
      .update({ profile_id: userRes.user?.id })
      .eq("id", id)
      .is("profile_id", null);

    if (claimError) {
      setError(claimError.message);
      setClaiming(null);
      return;
    }
    navigate("/supplier");
  }

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const btnA = { background: T.accent, color: T.onAccent };

  return (
    <PortalShell eyebrow="Supplier" title="Is your business already listed?">
      <PortalCard T={T}>
        <div className="mb-3 text-xs" style={{ color: T.sub }}>
          Search for your business below and claim it, or set up a brand new listing.
        </div>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.faint }} />
          <input
            type="search"
            placeholder="Search by business name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-9 pr-3.5 text-sm outline-none"
            style={inputS}
          />
        </div>

        {error && <div className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>{error}</div>}

        <div className="mt-3 space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
              <div className="min-w-0">
                <div className="text-xs font-bold">{s.name} <span className="font-normal" style={{ color: T.sub }}>— {s.category}</span></div>
                {s.headline && <div className="mt-0.5 text-[11px]" style={{ color: T.sub }}>{s.headline}</div>}
              </div>
              <button
                type="button"
                disabled={claiming === s.id}
                onClick={() => claim(s.id)}
                className="press flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60"
                style={btnA}
              >
                <Check size={11} />{claiming === s.id ? "Claiming…" : "This is my business"}
              </button>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No matching unclaimed listing.</div>}
        </div>
      </PortalCard>

      <button type="button" onClick={() => navigate("/supplier/onboarding")} className="w-full text-center text-xs font-bold" style={{ color: T.accent }}>
        Not listed yet? Set up your business →
      </button>
    </PortalShell>
  );
}
