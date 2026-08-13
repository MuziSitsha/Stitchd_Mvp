import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Store, Radio, Crown, MapPin, BadgeCheck, Check, Clock, Wallet, Percent,
  TrendingUp, Gift, Plus, Info, ArrowRight,
} from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Chip } from "../../components/proto/Chip";
import { Face } from "../../components/proto/Face";
import { Shot } from "../../components/proto/Shot";
import { randR } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { useAuth } from "../../lib/useAuth";
import { supabase } from "../../lib/supabase";
import { respondToLead, rerouteLead, adminToggleBoost } from "../../lib/functions";
import { computeSupplierStats, type OrderItemRow } from "../../lib/supplierStats";

type PortalRole = "supplier" | "ops" | "operator";

interface RealSupplier {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  review_count: number;
  verified: boolean;
  status: string;
  price_from_cents: number | null;
}

interface RealLead {
  id: string;
  ref: string;
  supplier_id: string;
  requester_name: string;
  requester_phone: string;
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

const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };
const BOOST_PRICE = 350;
const VERIFY_CONV_LIFT = 42;

export function SupplierPortalLens() {
  const { T, pal } = useTheme();
  const { toast } = useProtoState();
  const { session, loading: authLoading } = useAuth();
  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  const [roles, setRoles] = useState<string[]>([]);
  const [rolesChecked, setRolesChecked] = useState(false);
  const [portalRole, setPortalRole] = useState<PortalRole>("supplier");
  const [suppliers, setSuppliers] = useState<RealSupplier[]>([]);
  const [meSupplierId, setMeSupplierId] = useState<string | null>(null);
  const [leads, setLeads] = useState<RealLead[]>([]);
  const [orders, setOrders] = useState<{ id: string; total_cents: number; member_saving_cents: number }[]>([]);
  const [activeBoosts, setActiveBoosts] = useState<{ supplier_id: string; amount_cents: number }[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [verification, setVerification] = useState<{ status: string } | null>(null);
  const [rank, setRank] = useState<RankRow | null>(null);
  const [categoryCount, setCategoryCount] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rerouteTarget, setRerouteTarget] = useState<Record<string, string>>({});
  const [addonLabel, setAddonLabel] = useState("");
  const [addonPrice, setAddonPrice] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const canOperate = roles.includes("admin") || roles.includes("super");
  const canOps = roles.includes("ops") || canOperate;
  const hasAnyRole = roles.length > 0;

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setRoles([]);
      setRolesChecked(true);
      return;
    }
    setRolesChecked(false);
    supabase
      .from("role_assignments")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .in("role", ["ops", "admin", "super"])
      .then(({ data }) => {
        setRoles((data ?? []).map((r) => r.role as string));
        setRolesChecked(true);
      });
  }, [session, authLoading]);

  const loadSuppliers = useMemo(
    () => async () => {
      const { data } = await supabase
        .from("suppliers")
        .select("id, name, category, rating, review_count, verified, status, price_from_cents")
        .order("category")
        .order("name");
      setSuppliers(data ?? []);
    },
    [],
  );

  const loadLeads = useMemo(
    () => async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, ref, supplier_id, requester_name, requester_phone, details, status, created_at, order_id, orders(total_cents, member_saving_cents)")
        .order("created_at", { ascending: false })
        .limit(100);
      setLeads((data ?? []) as unknown as RealLead[]);
    },
    [],
  );

  const loadOrders = useMemo(
    () => async () => {
      const { data } = await supabase.from("orders").select("id, total_cents, member_saving_cents");
      setOrders(data ?? []);
    },
    [],
  );

  const loadBoosts = useMemo(
    () => async () => {
      const { data } = await supabase
        .from("boosts")
        .select("supplier_id, amount_cents")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());
      setActiveBoosts(data ?? []);
    },
    [],
  );

  useEffect(() => {
    if (!hasAnyRole) return;
    loadSuppliers();
    loadLeads();
    loadOrders();
    loadBoosts();

    const channel = supabase
      .channel("supplier-portal-lens")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, loadLeads)
      .on("postgres_changes", { event: "*", schema: "public", table: "suppliers" }, loadSuppliers)
      .on("postgres_changes", { event: "*", schema: "public", table: "boosts" }, loadBoosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hasAnyRole, loadSuppliers, loadLeads, loadOrders, loadBoosts]);

  useEffect(() => {
    if (!meSupplierId) return;
    supabase
      .from("order_items")
      .select("id, label, qty, line_total_cents, orders(id, ref, status, customer_name, customer_phone, occasion, hire_date, created_at, member_saving_cents)")
      .eq("supplier_id", meSupplierId)
      .then(({ data }) => setOrderItems((data ?? []) as unknown as OrderItemRow[]));

    supabase
      .from("supplier_addons")
      .select("id, label, price_cents")
      .eq("supplier_id", meSupplierId)
      .order("created_at")
      .then(({ data }) => setAddons(data ?? []));

    supabase
      .from("verifications")
      .select("status")
      .eq("supplier_id", meSupplierId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setVerification(data));

    const me = suppliers.find((s) => s.id === meSupplierId);
    if (me) {
      supabase
        .from("supplier_ranking")
        .select("rank_in_category, featured")
        .eq("id", meSupplierId)
        .eq("category", me.category)
        .maybeSingle()
        .then(({ data }) => setRank(data));
      supabase
        .from("supplier_ranking")
        .select("id", { count: "exact", head: true })
        .eq("category", me.category)
        .then(({ count }) => setCategoryCount(count ?? 0));
    }
  }, [meSupplierId, suppliers]);

  useEffect(() => {
    if (suppliers.length > 0 && !meSupplierId) setMeSupplierId(suppliers[0].id);
  }, [suppliers, meSupplierId]);

  async function quickPreview(role: "ops" | "admin" | "supplier") {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/auth-test-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "sandbox preview unavailable");
      await supabase.auth.setSession({ access_token: json.access_token, refresh_token: json.refresh_token });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Preview sign-in failed");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setAuthError(signInError.message);
    setAuthBusy(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setEmail("");
    setPassword("");
  }

  async function handleRespond(leadRef: string, action: "accept" | "decline") {
    setBusy(leadRef);
    setError(null);
    try {
      await respondToLead(leadRef, action);
      toast(action === "accept" ? "Lead accepted" : "Lead declined — route it to another supplier", action === "accept" ? "good" : "warn");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond");
    } finally {
      setBusy(null);
    }
  }

  async function handleReroute(leadRef: string) {
    const target = rerouteTarget[leadRef];
    if (!target) return;
    setBusy(leadRef);
    setError(null);
    try {
      const result = await rerouteLead(leadRef, target);
      toast(`Rerouted to ${result.supplier}`, "warn");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reroute");
    } finally {
      setBusy(null);
    }
  }

  async function handleToggleBoost(supplierId: string) {
    setBusy(supplierId);
    setError(null);
    try {
      const result = await adminToggleBoost(supplierId);
      toast(result.featured ? "Featured — jumps to the top of client search" : "Boost paused — back to organic ranking", result.featured ? "good" : "warn");
      loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle boost");
    } finally {
      setBusy(null);
    }
  }

  async function handleToggleVerify(supplierId: string, decision: "verified" | "rejected") {
    setBusy(supplierId);
    setError(null);
    const { error: fnError } = await supabase.functions.invoke("verifications-toggle", { body: { supplier_id: supplierId, decision } });
    if (fnError) setError(fnError.message);
    else toast(decision === "verified" ? `Verified — badge now shows to clients (+${VERIFY_CONV_LIFT}% conversion)` : "Verification removed");
    loadSuppliers();
    setBusy(null);
  }

  async function handleToggleStatus(s: RealSupplier) {
    setBusy(s.id);
    setError(null);
    const nextStatus = s.status === "active" ? "paused" : "active";
    const { error: statusError } = await supabase.from("suppliers").update({ status: nextStatus }).eq("id", s.id);
    if (statusError) setError(statusError.message);
    else loadSuppliers();
    setBusy(null);
  }

  async function addAddon(e: FormEvent) {
    e.preventDefault();
    if (!meSupplierId || !addonLabel.trim() || !addonPrice.trim()) return;
    const priceCents = Math.round(parseFloat(addonPrice) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError("Enter a valid add-on price.");
      return;
    }
    const { data, error: addError } = await supabase
      .from("supplier_addons")
      .insert({ supplier_id: meSupplierId, label: addonLabel.trim(), price_cents: priceCents })
      .select("id, label, price_cents")
      .single();
    if (addError) { setError(addError.message); return; }
    setAddons((prev) => [...prev, data]);
    setAddonLabel("");
    setAddonPrice("");
  }

  async function removeAddon(id: string) {
    setAddons((prev) => prev.filter((a) => a.id !== id));
    await supabase.from("supplier_addons").delete().eq("id", id);
  }

  const stats = useMemo(() => computeSupplierStats(orderItems), [orderItems]);

  const me = suppliers.find((s) => s.id === meSupplierId);
  const myLeads = leads.filter((l) => l.supplier_id === meSupplierId);
  const newLeads = myLeads.filter((l) => l.status === "new");
  const isBoosted = !!rank?.featured;

  const RoleTab = ({ k, label, I }: { k: PortalRole; label: string; I: typeof Store }) => (
    <button onClick={() => setPortalRole(k)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold press" style={portalRole === k ? btnA : { color: T.sub, background: T.panel2 }}>
      <I size={13} />{label}
    </button>
  );

  if (authLoading || (session && !rolesChecked)) {
    return <div className="rise" style={{ color: T.sub, fontSize: 13 }}>Checking access…</div>;
  }

  if (!hasAnyRole && session) {
    return (
      <div className="rise space-y-4">
        <div>
          <div style={{ ...bigNum, fontSize: 18 }}>SUPPLIER PORTAL</div>
          <div className="text-xs" style={{ color: T.sub }}>The other side of the marketplace — see how suppliers earn and how Stitchd upsells.</div>
        </div>
        <Card T={T} className="mx-auto max-w-sm">
          <div className="mb-2 text-sm font-bold">Not authorised</div>
          <div className="mb-3 text-xs" style={{ color: T.sub }}>
            Signed in as <b style={{ color: T.ink }}>{session.user.email}</b>, but this account doesn't hold an ops, admin or super role — this internal view is separate from a real supplier's own login.
            A real supplier's own dashboard lives at <a href="/supplier/login" style={{ color: T.accent }}>/supplier/login</a>.
          </div>
          <button onClick={handleSignOut} className="w-full rounded-lg py-2 text-sm font-bold press" style={btnG}>Sign out and try another account</button>
        </Card>
      </div>
    );
  }

  if (!hasAnyRole) {
    return (
      <div className="rise space-y-4">
        <div>
          <div style={{ ...bigNum, fontSize: 18 }}>SUPPLIER PORTAL</div>
          <div className="text-xs" style={{ color: T.sub }}>The other side of the marketplace — see how suppliers earn and how Stitchd upsells.</div>
        </div>
        <Card T={T} className="mx-auto max-w-sm">
          <div className="mb-2 text-sm font-bold">Sign in to view the Supplier Portal</div>
          <div className="mb-3 text-xs" style={{ color: T.sub }}>Internal ops/admin view — a real supplier's own dashboard lives at /supplier/login.</div>
          <form onSubmit={handleSignIn} className="space-y-2">
            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputS} />
            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputS} />
            {authError && <div className="text-xs" style={{ color: T.bad }}>{authError}</div>}
            <button type="submit" disabled={authBusy} className="w-full rounded-lg py-2 text-sm font-bold press" style={btnA}>{authBusy ? "Please wait…" : "Sign in"}</button>
          </form>
          <div className="mt-3 border-t pt-3 text-xs" style={{ borderColor: T.border, color: T.faint }}>Sandbox quick preview (test-token, no OTP):</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button onClick={() => quickPreview("ops")} disabled={authBusy} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={btnG}>Preview as Ops</button>
            <button onClick={() => quickPreview("admin")} disabled={authBusy} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={btnG}>Preview as Admin</button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="rise space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <div style={{ ...bigNum, fontSize: 18 }}>SUPPLIER PORTAL</div>
          <div className="text-xs" style={{ color: T.sub }}>The other side of the marketplace — see how suppliers earn and how Stitchd upsells.</div>
        </div>
        <div className="ml-auto flex gap-1.5">
          <RoleTab k="supplier" label="I'm a supplier" I={Store} />
          {canOps && <RoleTab k="ops" label="Marketplace ops" I={Radio} />}
          {canOperate && <RoleTab k="operator" label="Operator" I={Crown} />}
        </div>
      </div>

      {error && <div className="rounded-lg px-3 py-2 text-xs" style={{ background: rgba(T.bad, 0.12), color: T.bad }}>{error}</div>}

      {portalRole === "supplier" && me && (
        <div className="space-y-4">
          <Card T={T} className="!p-0 overflow-hidden">
            <div className="relative">
              <Shot cat={me.name === "Peg & Pole Co." ? "marquee2" : me.name === "The Table Company" ? "seating2" : me.category} seed={me.id} T={T} pal={pal} h={220} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,rgba(6,6,12,.85))" }} />
              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                <div>
                  <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 15, color: "#fff" }}>{me.name}</div>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: rgba("#fff", 0.85) }}>
                    <MapPin size={10} />{me.category}
                    {me.verified && <span className="flex items-center gap-0.5" style={{ color: "#8Fd0ff" }}><BadgeCheck size={11} />Verified</span>}
                  </div>
                </div>
                {(canOperate || canOps) && (
                  <select value={meSupplierId ?? ""} onChange={(e) => setMeSupplierId(e.target.value)} className="rounded-lg px-2 py-1 text-xs" style={inputS}>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
              {([
                ["Earnings 30d", randR(stats.earnings30d / 100), T.gold],
                ["Paid orders", stats.ordersCount, T.ink],
                ["Rating", me.rating ?? "—", T.good],
                ["Repeat", stats.repeatPct + "%", T.info],
              ] as const).map(([l, v, c]) => (
                <div key={l} className="rounded-xl p-2 text-center" style={{ background: T.panel2 }}>
                  <div className="tnum" style={{ ...bigNum, fontSize: 17, color: c }}>{v}</div>
                  <div className="text-xs" style={{ color: T.sub }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2.5" style={{ borderColor: T.border }}>
              <button
                onClick={() => canOperate && handleToggleStatus(me)}
                disabled={!canOperate || busy === me.id}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                style={me.status === "active" ? { background: rgba(T.good, 0.15), color: T.good } : { background: rgba(T.warn, 0.15), color: T.warn }}
              >
                {me.status === "active" ? <><Check size={12} />Listing live</> : <><Clock size={12} />Paused</>}
              </button>
              {me.price_from_cents != null && <span className="text-xs" style={{ color: T.sub }}>Rate: <b style={{ color: T.ink }}>{randR(me.price_from_cents / 100)}</b></span>}
              <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: T.faint }}>
                <Wallet size={12} />{randR(stats.lifetimeEarnedCents / 100)} earned lifetime — payouts handled manually for now
              </span>
            </div>
          </Card>

          <Card T={T}>
            <div className="mb-2 flex items-center gap-2">
              <Radio size={14} style={{ color: T.accent }} />
              <span className="text-sm font-bold">Incoming leads</span>
              {newLeads.length > 0 && <span className="rounded-full px-1.5 py-0.5 tnum" style={{ fontSize: 10, fontWeight: 800, background: rgba(T.accent, 0.15), color: T.accent }}>{newLeads.length} new</span>}
              <span className="ml-auto text-xs" style={{ color: T.faint }}>respond fast — it lifts your rank</span>
            </div>
            <div className="space-y-2">
              {myLeads.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-2.5" style={{ borderColor: l.status === "new" ? rgba(T.accent, 0.4) : T.border, background: l.status === "new" ? rgba(T.accent, 0.04) : "transparent" }}>
                  <Face seed={l.id} T={T} size={30} name={l.requester_name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {l.requester_name}
                      {l.orders && l.orders.member_saving_cents > 0 && <span className="flex items-center gap-0.5 rounded px-1 text-xs" style={{ background: rgba(T.accent, 0.14), color: T.accent, fontSize: 9, fontWeight: 800 }}><Percent size={8} />STITCHED+</span>}
                    </div>
                    <div className="text-xs" style={{ color: T.sub }}>
                      {l.details ?? "Direct request"}{l.orders && <> · <b className="tnum" style={{ color: T.gold }}>{randR(l.orders.total_cents / 100)}</b></>}
                    </div>
                  </div>
                  {l.status === "new" && canOperate ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleRespond(l.ref, "accept")} disabled={busy === l.ref} className="rounded-lg px-3 py-1.5 text-xs font-bold press" style={btnA}>Accept</button>
                      <button onClick={() => handleRespond(l.ref, "decline")} disabled={busy === l.ref} className="rounded-lg px-2.5 py-1.5 text-xs font-bold" style={btnG}>Pass</button>
                    </div>
                  ) : (
                    <Chip c={l.status === "accepted" ? T.good : l.status === "new" ? T.accent : T.faint} T={T}>{l.status}</Chip>
                  )}
                </div>
              ))}
              {myLeads.length === 0 && <div className="py-4 text-center text-xs" style={{ color: T.faint }}>No leads yet. Get Featured below to pull more in.</div>}
            </div>
          </Card>

          <Card T={T} style={{ borderColor: rgba(T.accent, 0.4) }}>
            <div className="flex items-center gap-1.5 text-sm font-bold"><Percent size={14} style={{ color: T.accent }} />Stitched+ brings you demand</div>
            <div className="mt-1 text-xs" style={{ color: T.sub }}><b className="tnum" style={{ color: T.accent }}>{stats.memberSharePct}%</b> of your paid orders come from Stitched+ members — they book more and cancel less.</div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.08) }}>
              <div className="h-full rounded-full" style={{ width: `${stats.memberSharePct}%`, background: T.accent }} />
            </div>
          </Card>

          <Card T={T} style={{ borderColor: isBoosted ? rgba(T.gold, 0.5) : T.border }}>
            <div className="flex items-center gap-1.5 text-sm font-bold"><TrendingUp size={14} style={{ color: T.gold }} />Boost — Featured placement</div>
            <div className="mt-1 text-xs" style={{ color: T.sub }}>
              {rank ? <>You're currently <b style={{ color: T.ink }}>#{rank.rank_in_category}</b> of {categoryCount} in {me.category}.</> : "Paused listings don't rank."} Featured jumps you to the top of client search.
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg p-1.5" style={{ background: T.panel2 }}><div className="tnum font-bold">{myLeads.length}</div><div style={{ color: T.faint }}>total leads</div></div>
              <div className="rounded-lg p-1.5" style={{ background: rgba(T.gold, 0.1) }}><div className="tnum font-bold" style={{ color: T.gold }}>{stats.ordersCount}</div><div style={{ color: T.faint }}>paid orders</div></div>
            </div>
            <button
              onClick={() => canOperate && handleToggleBoost(me.id)}
              disabled={!canOperate || busy === me.id}
              className="press mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold"
              style={isBoosted ? { background: rgba(T.gold, 0.15), color: T.gold } : btnA}
            >
              {isBoosted ? <><Check size={12} />Featured active</> : <><TrendingUp size={12} />Feature this supplier · comp {randR(BOOST_PRICE)}/wk</>}
            </button>
            {isBoosted && <div className="mt-1.5 text-center text-xs" style={{ color: T.good }}>Live now — check the client Stitch It tab, they're on top ↑</div>}
            {!canOperate && <div className="mt-1.5 text-center text-xs" style={{ color: T.faint }}>Admin/super only</div>}
          </Card>

          <Card T={T}>
            <div className="flex items-center gap-1.5 text-sm font-bold"><Gift size={14} style={{ color: T.info }} />Package add-ons</div>
            <div className="mt-1 text-xs" style={{ color: T.sub }}>Suppliers who offer add-ons earn bigger baskets. Yours:</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {addons.length ? addons.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1">
                  <Chip c={T.info} T={T}>{a.label} {randR(a.price_cents / 100)}</Chip>
                  {canOperate && <button onClick={() => removeAddon(a.id)} aria-label={`Remove ${a.label}`} style={{ color: T.faint, fontSize: 14, lineHeight: 1 }}>×</button>}
                </span>
              )) : <span className="text-xs" style={{ color: T.faint }}>None yet</span>}
            </div>
            {canOperate && (
              <form onSubmit={addAddon} className="mt-2 flex gap-1">
                <input value={addonLabel} onChange={(e) => setAddonLabel(e.target.value)} placeholder="Name" className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-xs" style={inputS} />
                <input value={addonPrice} onChange={(e) => setAddonPrice(e.target.value)} placeholder="R" inputMode="decimal" className="w-14 rounded-lg px-2 py-1.5 text-xs" style={inputS} />
                <button type="submit" className="flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-semibold" style={btnG}><Plus size={12} /></button>
              </form>
            )}
          </Card>

          <Card T={T} style={{ borderColor: me.verified ? rgba(T.info, 0.4) : T.border }}>
            <div className="flex items-center gap-1.5 text-sm font-bold"><BadgeCheck size={14} style={{ color: T.info }} />Verified badge</div>
            <div className="mt-1 text-xs" style={{ color: T.sub }}>Verified suppliers convert <b style={{ color: T.info }}>+{VERIFY_CONV_LIFT}%</b> better. {verification?.status === "pending" && !me.verified && "Request pending."}</div>
            {canOperate ? (
              <button
                onClick={() => handleToggleVerify(me.id, me.verified ? "rejected" : "verified")}
                disabled={busy === me.id}
                className="press mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold"
                style={me.verified ? { background: rgba(T.info, 0.15), color: T.info } : { background: T.info, color: "#fff" }}
              >
                {me.verified ? <><Check size={12} />Verified</> : <><BadgeCheck size={12} />Verify — free</>}
              </button>
            ) : (
              <div className="mt-2 text-center text-xs" style={{ color: T.faint }}>{me.verified ? "Verified" : "Not verified"}</div>
            )}
          </Card>
        </div>
      )}

      {portalRole === "ops" && canOps && (() => {
        const nu = leads.filter((l) => l.status === "new");
        const gmv = orders.reduce((a, o) => a + o.total_cents, 0);
        const memberLeads = leads.filter((l) => l.orders && l.orders.member_saving_cents > 0).length;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([
                ["Open leads", nu.length, T.warn],
                ["Pipeline GMV", randR(gmv / 100), T.gold],
                ["Take-rate (12%)", randR((gmv / 100) * 0.12), T.good],
                ["Member leads", memberLeads + "/" + leads.length, T.accent],
              ] as const).map(([l, v, c]) => (
                <Card key={l} T={T} className="text-center">
                  <div className="tnum" style={{ ...bigNum, fontSize: 19, color: c }}>{v}</div>
                  <div className="text-xs" style={{ color: T.sub }}>{l}</div>
                </Card>
              ))}
            </div>
            <Card T={T}>
              <div className="mb-2 flex items-center gap-2">
                <Radio size={14} style={{ color: T.accent }} />
                <span className="text-sm font-bold">Live lead board</span>
                <span className="ml-auto text-xs" style={{ color: T.faint }}>route, accept or reassign across all suppliers</span>
              </div>
              <div className="space-y-2">
                {leads.map((l) => {
                  const sp = suppliers.find((s) => s.id === l.supplier_id);
                  return (
                    <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-2.5" style={{ borderColor: l.status === "new" ? rgba(T.accent, 0.4) : T.border }}>
                      <Face seed={l.id} T={T} size={28} name={l.requester_name} />
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="font-semibold">{l.requester_name}</div>
                        <div className="text-xs" style={{ color: T.sub }}>→ {sp?.name ?? "unknown"} ({sp?.category}) {l.orders && <>· <b className="tnum" style={{ color: T.gold }}>{randR(l.orders.total_cents / 100)}</b></>}</div>
                      </div>
                      {l.orders && l.orders.member_saving_cents > 0 && <Chip c={T.accent} T={T}><Percent size={9} />Member</Chip>}
                      {l.status === "new" ? (
                        <div className="flex items-center gap-1.5">
                          <select value={rerouteTarget[l.ref] ?? l.supplier_id} onChange={(e) => setRerouteTarget((prev) => ({ ...prev, [l.ref]: e.target.value }))} className="rounded-lg px-1.5 py-1 text-xs" style={inputS}>
                            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <button onClick={() => handleReroute(l.ref)} disabled={busy === l.ref} className="rounded-lg px-2.5 py-1.5 text-xs font-bold" style={btnG}>Reroute</button>
                        </div>
                      ) : (
                        <Chip c={l.status === "accepted" ? T.good : T.faint} T={T}>{l.status}</Chip>
                      )}
                    </div>
                  );
                })}
                {leads.length === 0 && <div className="py-4 text-center text-xs" style={{ color: T.faint }}>No leads yet.</div>}
              </div>
            </Card>
          </div>
        );
      })()}

      {portalRole === "operator" && canOperate && (() => {
        const verifiedCount = suppliers.filter((s) => s.verified).length;
        const featuredSet = new Set(activeBoosts.map((b) => b.supplier_id));
        const paidFeaturedCount = activeBoosts.filter((b) => b.amount_cents > 0).length;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([
                ["Suppliers", suppliers.length, T.ink],
                ["Verified", verifiedCount, T.info],
                ["Featured (paid)", paidFeaturedCount, T.gold],
                ["Boost MRR", randR(paidFeaturedCount * BOOST_PRICE * 4.3), T.good],
              ] as const).map(([l, v, c]) => (
                <Card key={l} T={T} className="text-center">
                  <div className="tnum" style={{ ...bigNum, fontSize: 19, color: c }}>{v}</div>
                  <div className="text-xs" style={{ color: T.sub }}>{l}</div>
                </Card>
              ))}
            </div>
            <Card T={T}>
              <div className="mb-2 flex items-center gap-2">
                <Crown size={14} style={{ color: T.gold }} />
                <span className="text-sm font-bold">Manage all suppliers</span>
                <span className="ml-auto text-xs" style={{ color: T.faint }}>verify, feature, or open their listing</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {suppliers.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 rounded-xl border p-2" style={{ borderColor: featuredSet.has(h.id) ? rgba(T.gold, 0.4) : T.border }}>
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg"><Shot cat={h.name === "Peg & Pole Co." ? "marquee2" : h.name === "The Table Company" ? "seating2" : h.category} seed={h.id} T={T} pal={pal} h={36} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-sm font-semibold">{h.name}{h.verified && <BadgeCheck size={12} style={{ color: T.info }} />}</div>
                      <div className="truncate text-xs" style={{ color: T.sub }}>{h.category} · ★{h.rating ?? "—"}</div>
                    </div>
                    <button onClick={() => handleToggleVerify(h.id, h.verified ? "rejected" : "verified")} disabled={busy === h.id} className="rounded-lg p-1.5" style={h.verified ? { background: rgba(T.info, 0.15), color: T.info } : btnG} aria-label="Toggle verified"><BadgeCheck size={13} /></button>
                    <button onClick={() => handleToggleBoost(h.id)} disabled={busy === h.id} className="rounded-lg p-1.5" style={featuredSet.has(h.id) ? { background: rgba(T.gold, 0.15), color: T.gold } : btnG} aria-label="Toggle featured"><TrendingUp size={13} /></button>
                    <button onClick={() => { setMeSupplierId(h.id); setPortalRole("supplier"); }} className="rounded-lg p-1.5" style={btnG} aria-label="Open listing"><ArrowRight size={13} /></button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      })()}

      <div className="flex items-center gap-1.5 text-xs" style={{ color: T.faint }}>
        <Info size={11} />Boost & Verified changes here flow straight to the client <b style={{ color: T.gold }}>Stitch It</b> tab and the wedding squad — that's the upsell loop, live.
      </div>
    </div>
  );
}
