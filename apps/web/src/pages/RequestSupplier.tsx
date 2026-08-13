import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { createLead } from "../lib/functions";
import { Header } from "../components/Header";

interface Supplier {
  id: string;
  category: string;
  name: string;
  headline: string | null;
  rating: number | null;
  verified: boolean;
}

export function RequestSupplier() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ requester_name: "", requester_phone: "", requester_email: "", details: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("suppliers")
      .select("id, category, name, headline, rating, verified")
      .eq("status", "active")
      .order("category")
      .then(({ data, error: fetchError }) => {
        if (fetchError) setError(fetchError.message);
        else setSuppliers(data ?? []);
      });
  }, []);

  async function submit(supplierId: string) {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createLead({ supplier_id: supplierId, ...form });
      setConfirmation(`Request sent to ${result.supplier} — ref ${result.ref}`);
      setOpenId(null);
      setForm({ requester_name: "", requester_phone: "", requester_email: "", details: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="request-page portal-page">
        <h1>Find a supplier</h1>
        <p>Browse and request a supplier directly — they'll be notified right away.</p>

        {confirmation && <p className="confirmation">{confirmation}</p>}
        {error && <p className="error">{error}</p>}

        <ul className="supplier-list">
          {suppliers.map((s) => (
            <li key={s.id}>
              <div>
                <strong>{s.name}</strong> · {s.category}
                {s.verified && <span className="badge verified">Verified</span>}
                {s.rating && <span> · {s.rating} ★</span>}
                {s.headline && <p>{s.headline}</p>}
              </div>

              {openId === s.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit(s.id);
                  }}
                >
                  <input
                    required
                    placeholder="Your name"
                    value={form.requester_name}
                    onChange={(e) => setForm({ ...form, requester_name: e.target.value })}
                  />
                  <input
                    required
                    placeholder="Your phone"
                    value={form.requester_phone}
                    onChange={(e) => setForm({ ...form, requester_phone: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Your email (optional)"
                    value={form.requester_email}
                    onChange={(e) => setForm({ ...form, requester_email: e.target.value })}
                  />
                  <textarea
                    placeholder="What do you need?"
                    value={form.details}
                    onChange={(e) => setForm({ ...form, details: e.target.value })}
                  />
                  <button type="submit" disabled={submitting}>
                    {submitting ? "Sending..." : "Send request"}
                  </button>
                </form>
              ) : (
                <button type="button" onClick={() => setOpenId(s.id)}>
                  Request this supplier
                </button>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
