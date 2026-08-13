import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Header } from "../components/Header";

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

  return (
    <>
      <Header />
      <main className="claim-page portal-page">
        <h1>Is your business already listed?</h1>
        <p>Search for your business below and claim it, or skip to create a new listing.</p>

        <input
          type="search"
          placeholder="Search by business name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <ul className="claim-list">
          {filtered.map((s) => (
            <li key={s.id}>
              <div>
                <strong>{s.name}</strong>
                <span> — {s.category}</span>
                {s.headline && <p>{s.headline}</p>}
              </div>
              <button type="button" disabled={claiming === s.id} onClick={() => claim(s.id)}>
                {claiming === s.id ? "Claiming..." : "This is my business"}
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li>No matching unclaimed listing.</li>}
        </ul>

        {!creating ? (
          <button type="button" className="link-button" onClick={() => setCreating(true)}>
            Skip — create a new listing
          </button>
        ) : (
          <form onSubmit={createListing}>
            <h2>Create a new listing</h2>
            <label>
              Business name
              <input required value={newName} onChange={(e) => setNewName(e.target.value)} />
            </label>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sub)", marginBottom: 6 }}>
                Categories — pick all that apply
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                {CATEGORIES.map((c) => (
                  <label key={c} style={{ flexDirection: "row", alignItems: "center", gap: 6, width: "auto", fontWeight: 400, color: "var(--ink)" }}>
                    <input type="checkbox" checked={newCategories.has(c)} onChange={() => toggleCategory(c)} style={{ width: "auto" }} />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <label>
              Headline (optional)
              <input value={newHeadline} onChange={(e) => setNewHeadline(e.target.value)} placeholder="One line about what you do" />
            </label>
            <button type="submit" disabled={submitting || !newName.trim()}>
              {submitting ? "Creating..." : "Create listing"}
            </button>
            <button type="button" className="link-button" onClick={() => setCreating(false)}>
              Back to search
            </button>
          </form>
        )}
      </main>
    </>
  );
}
