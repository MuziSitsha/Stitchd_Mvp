import { useEffect, useState, useCallback, useMemo, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { respondToLead, startBoostCheckout } from "../lib/functions";
import { computeSupplierStats, groupOrderItems, type OrderItemRow } from "../lib/supplierStats";
import { Header } from "../components/Header";

interface Supplier {
  id: string;
  category: string;
  name: string;
  headline: string | null;
  rating: number | null;
  review_count: number;
  verified: boolean;
  status: string;
  price_from_cents: number | null;
}

interface Lead {
  id: string;
  ref: string;
  requester_name: string;
  requester_phone: string;
  requester_email: string | null;
  details: string | null;
  status: "new" | "accepted" | "declined";
  created_at: string;
  order_id: string | null;
  orders: { total_cents: number; member_saving_cents: number } | null;
}

interface RankRow {
  rank_in_category: number;
  featured: boolean;
}

interface Addon {
  id: string;
  label: string;
  price_cents: number;
}

interface Verification {
  status: "pending" | "verified" | "rejected";
}

const rand = (cents: number) => `R${Math.round(cents / 100).toLocaleString("en-ZA")}`;

export function SupplierPortal() {
  const [supplier, setSupplier] = useState<Supplier | null | undefined>(undefined);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rank, setRank] = useState<RankRow | null>(null);
  const [categoryCount, setCategoryCount] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [boosting, setBoosting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [addonLabel, setAddonLabel] = useState("");
  const [addonPrice, setAddonPrice] = useState("");
  const [addonSubmitting, setAddonSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadSupplier = useCallback(async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      navigate("/supplier/login");
      return;
    }
    const { data, error: fetchError } = await supabase
      .from("suppliers")
      .select("id, category, name, headline, rating, review_count, verified, status, price_from_cents")
      .eq("profile_id", userRes.user.id)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    if (!data) {
      navigate("/supplier/claim");
      return;
    }
    setSupplier(data);
  }, [navigate]);

  useEffect(() => {
    loadSupplier();
  }, [loadSupplier]);

  useEffect(() => {
    if (!supplier) return;

    supabase
      .from("leads")
      .select("id, ref, requester_name, requester_phone, requester_email, details, status, created_at, order_id, orders(total_cents, member_saving_cents)")
      .eq("supplier_id", supplier.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setLeads((data ?? []) as unknown as Lead[]));

    supabase
      .from("supplier_ranking")
      .select("rank_in_category, featured")
      .eq("id", supplier.id)
      .eq("category", supplier.category)
      .maybeSingle()
      .then(({ data }) => setRank(data));

    supabase
      .from("supplier_ranking")
      .select("id", { count: "exact", head: true })
      .eq("category", supplier.category)
      .then(({ count }) => setCategoryCount(count ?? 0));

    supabase
      .from("order_items")
      .select("id, label, qty, line_total_cents, orders(id, ref, status, customer_name, customer_phone, occasion, hire_date, created_at, member_saving_cents)")
      .eq("supplier_id", supplier.id)
      .then(({ data }) => setOrderItems((data ?? []) as unknown as OrderItemRow[]));

    supabase
      .from("supplier_addons")
      .select("id, label, price_cents")
      .eq("supplier_id", supplier.id)
      .order("created_at")
      .then(({ data }) => setAddons(data ?? []));

    supabase
      .from("verifications")
      .select("status")
      .eq("supplier_id", supplier.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setVerification(data));

    const channel = supabase
      .channel(`supplier:${supplier.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads", filter: `supplier_id=eq.${supplier.id}` },
        (payload) => {
          setLeads((prev) => {
            const incoming = payload.new as Lead;
            const withoutIncoming = prev.filter((l) => l.id !== incoming.id);
            return [incoming, ...withoutIncoming].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            );
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supplier]);

  const stats = useMemo(() => computeSupplierStats(orderItems), [orderItems]);
  const orderGroups = useMemo(() => groupOrderItems(orderItems), [orderItems]);

  async function handleRespond(leadRef: string, action: "accept" | "decline") {
    setError(null);
    try {
      await respondToLead(leadRef, action);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond to lead");
    }
  }

  async function handleBoost() {
    setBoosting(true);
    setError(null);
    try {
      const { checkout_url } = await startBoostCheckout();
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Boost checkout unavailable right now");
      setBoosting(false);
    }
  }

  async function handleSwitchBusiness() {
    if (!supplier) return;
    if (!window.confirm(`Release "${supplier.name}" and pick a different listing?`)) return;
    setError(null);
    const { error: releaseError } = await supabase.from("suppliers").update({ profile_id: null }).eq("id", supplier.id);
    if (releaseError) {
      setError(releaseError.message);
      return;
    }
    navigate("/supplier/claim");
  }

  async function toggleListingStatus() {
    if (!supplier) return;
    setTogglingStatus(true);
    setError(null);
    const nextStatus = supplier.status === "active" ? "paused" : "active";
    const { error: statusError } = await supabase.from("suppliers").update({ status: nextStatus }).eq("id", supplier.id);
    setTogglingStatus(false);
    if (statusError) {
      setError(statusError.message);
      return;
    }
    setSupplier({ ...supplier, status: nextStatus });
  }

  async function requestVerification() {
    if (!supplier) return;
    setRequestingVerification(true);
    setError(null);
    const { data, error: reqError } = await supabase
      .from("verifications")
      .insert({ supplier_id: supplier.id, status: "pending" })
      .select("status")
      .single();
    setRequestingVerification(false);
    if (reqError) {
      setError(reqError.message);
      return;
    }
    setVerification(data);
  }

  async function addAddon(e: FormEvent) {
    e.preventDefault();
    if (!supplier || !addonLabel.trim() || !addonPrice.trim()) return;
    const priceCents = Math.round(parseFloat(addonPrice) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError("Enter a valid add-on price.");
      return;
    }
    setAddonSubmitting(true);
    setError(null);
    const { data, error: addError } = await supabase
      .from("supplier_addons")
      .insert({ supplier_id: supplier.id, label: addonLabel.trim(), price_cents: priceCents })
      .select("id, label, price_cents")
      .single();
    setAddonSubmitting(false);
    if (addError) {
      setError(addError.message);
      return;
    }
    setAddons((prev) => [...prev, data]);
    setAddonLabel("");
    setAddonPrice("");
  }

  async function removeAddon(id: string) {
    setAddons((prev) => prev.filter((a) => a.id !== id));
    const { error: delError } = await supabase.from("supplier_addons").delete().eq("id", id);
    if (delError) setError(delError.message);
  }

  if (supplier === undefined) {
    return (
      <>
        <Header />
        <main className="portal-page">Loading...</main>
      </>
    );
  }
  if (supplier === null) return null;

  return (
    <>
      <Header right={<span className="badge rating">{supplier.category}</span>} />
      <main className="supplier-portal portal-page">
        <div className="portal-hero">
          <h1>{supplier.name}</h1>
          <p>
            {supplier.category}
            {supplier.headline ? ` · ${supplier.headline}` : ""}
          </p>
          <div className="badges">
            {supplier.verified && <span className="badge verified">Verified</span>}
            {rank?.featured && <span className="badge featured">Featured</span>}
            {supplier.rating && (
              <span className="badge rating">
                {supplier.rating} ★ ({supplier.review_count})
              </span>
            )}
          </div>
          {supplier.status === "active" && rank && (
            <p className="rank-preview">
              You're currently ranked <strong>#{rank.rank_in_category}</strong> of {categoryCount} in {supplier.category}
              {!rank.featured && " — Boost to move to the top."}
            </p>
          )}
          {supplier.status !== "active" && (
            <p className="rank-preview">Paused listings don't appear in client search or rankings.</p>
          )}
          <button type="button" className="link-button" onClick={handleSwitchBusiness}>
            Wrong business? Switch listing
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <section>
          <h2>Your numbers</h2>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-value">{rand(stats.earnings30d)}</div>
              <div className="stat-label">Earnings 30d</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.ordersCount}</div>
              <div className="stat-label">Paid orders</div>
            </div>
            <div className="stat">
              <div className="stat-value">{supplier.rating ?? "—"}</div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.repeatPct}%</div>
              <div className="stat-label">Repeat</div>
            </div>
          </div>
          <div className="flex-row-wrap">
            <button
              type="button"
              className="link-button"
              onClick={toggleListingStatus}
              disabled={togglingStatus}
            >
              {supplier.status === "active" ? "Listing live — pause it" : "Listing paused — make it live"}
            </button>
            {supplier.price_from_cents != null && (
              <span className="rank-preview">
                Rate: <strong>{rand(supplier.price_from_cents)}</strong>
              </span>
            )}
          </div>
          <p className="rank-preview">
            Payouts are handled manually for now — {rand(orderItems.filter((oi) => oi.orders.status === "paid").reduce((s, oi) => s + oi.line_total_cents, 0))} earned lifetime via Stitchd.
          </p>
        </section>

        <section>
          <h2>Stitched+ brings you demand</h2>
          <p>
            <strong>{stats.memberSharePct}%</strong> of your paid orders come from Stitched+ members — they book more and cancel less.
          </p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${stats.memberSharePct}%` }} />
          </div>
        </section>

        <section>
          <h2>Grow your visibility</h2>
          <p>{leads.length} total leads via Stitchd so far.</p>
          <button type="button" onClick={handleBoost} disabled={boosting}>
            {boosting ? "Redirecting to checkout..." : "Boost for R350/week"}
          </button>
        </section>

        <section>
          <h2>Package add-ons</h2>
          <p>Suppliers who offer add-ons earn bigger baskets. Yours:</p>
          <div className="addon-list">
            {addons.map((a) => (
              <span key={a.id} className="addon-chip">
                {a.label} {rand(a.price_cents)}
                <button type="button" onClick={() => removeAddon(a.id)} aria-label={`Remove ${a.label}`}>
                  ×
                </button>
              </span>
            ))}
            {addons.length === 0 && <span className="rank-preview">None yet</span>}
          </div>
          <form onSubmit={addAddon} className="addon-form">
            <input
              value={addonLabel}
              onChange={(e) => setAddonLabel(e.target.value)}
              placeholder="Add-on name, e.g. Extra hour"
            />
            <input
              value={addonPrice}
              onChange={(e) => setAddonPrice(e.target.value)}
              placeholder="Price (R)"
              inputMode="decimal"
            />
            <button type="submit" disabled={addonSubmitting || !addonLabel.trim() || !addonPrice.trim()}>
              {addonSubmitting ? "Adding..." : "Add"}
            </button>
          </form>
        </section>

        <section>
          <h2>Verified badge</h2>
          <p>Verified suppliers convert better — clients trust the tick. Free; we check your docs &amp; reviews.</p>
          {supplier.verified ? (
            <span className="badge verified">Verified</span>
          ) : verification?.status === "pending" ? (
            <span className="badge rating">Request pending — we'll be in touch</span>
          ) : (
            <button type="button" onClick={requestVerification} disabled={requestingVerification}>
              {requestingVerification ? "Requesting..." : "Request verification — free"}
            </button>
          )}
        </section>

        <section>
          <h2>Leads ({leads.filter((l) => l.status === "new").length} new)</h2>
          {leads.length === 0 && <p>No leads yet — they'll appear here in real time.</p>}
          <ul className="lead-list">
            {leads.map((lead) => (
              <li key={lead.id} className={`lead lead-${lead.status}`}>
                <div>
                  <strong>{lead.requester_name}</strong> · {lead.requester_phone}
                  {lead.orders && (lead.orders.member_saving_cents > 0) && <span className="badge featured">Stitched+</span>}
                  {lead.orders && <span className="badge rating">{rand(lead.orders.total_cents)}</span>}
                  {lead.details && <p>{lead.details}</p>}
                  <span className="ref">{lead.ref}</span>
                </div>
                {lead.status === "new" ? (
                  <div className="lead-actions">
                    <button type="button" onClick={() => handleRespond(lead.ref, "accept")}>
                      Accept
                    </button>
                    <button type="button" onClick={() => handleRespond(lead.ref, "decline")}>
                      Decline
                    </button>
                  </div>
                ) : (
                  <span className={`status status-${lead.status}`}>{lead.status}</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Your orders</h2>
          {orderGroups.length === 0 && <p>No bookings yet — paid bookings will show up here automatically.</p>}
          <ul className="supplier-list">
            {orderGroups.map((g) => (
              <li key={g.order.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div className="flex-row-wrap" style={{ justifyContent: "space-between", width: "100%" }}>
                  <div>
                    <strong>{g.order.customer_name}</strong> · {g.order.customer_phone}
                    {g.order.occasion && <span> · {g.order.occasion}</span>}
                    {g.order.hire_date && <span> · {g.order.hire_date}</span>}
                    <span className="ref">{g.order.ref}</span>
                  </div>
                  <span className={`status status-${g.order.status}`}>
                    {g.order.status === "paid" ? "Paid" : g.order.status.replace("_", " ")}
                  </span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
                  {g.items.map((it) => (
                    <li key={it.id} className="flex-row-wrap" style={{ justifyContent: "space-between", color: "var(--sub)", fontSize: 13 }}>
                      <span>{it.label} × {it.qty}</span>
                      <span>{rand(it.line_total_cents)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
