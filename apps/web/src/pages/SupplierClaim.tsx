import { useEffect, useState, type FormEvent } from "react";
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

const CATEGORIES = [
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
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategories, setNewCategories] = useState<Set<string>>(new Set());
  const [newHeadline, setNewHeadline] = useState("");

  function toggleCategory(cat: string) {
    setNewCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }
  const [submitting, setSubmitting] = useState(false);
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

  async function createListing(e: FormEvent) {
    e.preventDefault();
    if (newCategories.size === 0) {
      setError("Pick at least one category.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { data: userRes } = await supabase.auth.getUser();
    const categories = [...newCategories];
    const { data: created, error: createError } = await supabase
      .from("suppliers")
      .insert({
        profile_id: userRes.user?.id,
        name: newName.trim(),
        category: categories[0],
        headline: newHeadline.trim() || null,
        status: "active",
      })
      .select("id")
      .single();

    if (createError) {
      setError(createError.code === "23505" ? "A listing with that name already exists — try searching for it above." : createError.message);
      setSubmitting(false);
      return;
    }

    const { error: catError } = await supabase
      .from("supplier_categories")
      .insert(categories.map((category) => ({ supplier_id: created.id, category })));
    if (catError) {
      setError(`Listing created, but categories failed to save: ${catError.message}`);
      setSubmitting(false);
      return;
    }

    navigate("/supplier");
  }

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };

  return (
    <PortalShell eyebrow="Supplier" title="Is your business already listed?">
      <PortalCard T={T}>
        <div className="mb-3 text-xs" style={{ color: T.sub }}>
          Search for your business below and claim it, or skip to create a new listing.
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

      {!creating ? (
        <button type="button" onClick={() => setCreating(true)} className="w-full text-center text-xs font-bold" style={{ color: T.accent }}>
          Skip — create a new listing
        </button>
      ) : (
        <PortalCard T={T}>
          <form onSubmit={createListing} className="space-y-3">
            <div className="text-sm font-bold">Create a new listing</div>
            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Business name</div>
              <input required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
            </label>
            <div>
              <div className="mb-1.5 text-xs font-semibold" style={{ color: T.sub }}>Categories — pick all that apply</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {CATEGORIES.map((c) => (
                  <label key={c} className="flex items-center gap-1.5 text-xs" style={{ color: T.ink }}>
                    <input type="checkbox" checked={newCategories.has(c)} onChange={() => toggleCategory(c)} className="h-3.5 w-3.5" />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Headline (optional)</div>
              <input value={newHeadline} onChange={(e) => setNewHeadline(e.target.value)} placeholder="One line about what you do" className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting || !newName.trim()} className="press flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-60" style={btnA}>
                {submitting ? "Creating…" : "Create listing"}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="press rounded-xl px-4 py-2.5 text-sm font-bold" style={btnG}>
                Back to search
              </button>
            </div>
          </form>
        </PortalCard>
      )}
    </PortalShell>
  );
}
