import { useMemo, useState } from "react";
import {
  ShoppingBag, Zap, Percent, BadgeCheck, ShoppingCart, TrendingUp, MapPin, Star,
  Plus, Minus, X, Check, CalendarCheck, Printer, ClipboardCheck, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Shot } from "../../components/proto/Shot";
import { hash } from "../../components/proto/imagery";
import { HIRE, HIRE_CATS, OCCASIONS, SUB, randR } from "../../components/proto/data";
import { useProtoState, type Basket } from "../../state/ProtoState";
import { supabase } from "../../lib/supabase";
import { createOrder, checkoutOrder } from "../../lib/functions";
import { useLiveSupplierStatus } from "../../state/useLiveSupplierStatus";

type PrintDoc = { kind: "quote" | "checklist" };

const CHECKLISTS: Record<string, string[]> = {
  birthday: ["Confirm final head-count 48h before", "Clear delivery access for the castle", "Power point within 25m of the castle", "Someone to receive delivery from 8am", "Cake + candles (that's on you!)", "Bin bags & clean-up plan"],
  funeral: ["Confirm numbers with the family", "Programme printed", "Seating faces the front", "PA tested before the service", "Catering set-up area shaded", "Parking & access marshalled"],
  wedding: ["Final numbers to caterer 14 days out", "Marquee flooring level-checked", "Sound tested at the venue", "Décor palette confirmed with supplier", "Power load checked with generator", "Wet-weather plan agreed"],
  corporate: ["Delegate count confirmed", "AV run-through booked", "Coffee cart power sorted", "Signage & branding placed", "Back-up generator fuelled", "Pack-down time agreed with venue"],
  braai: ["Meat count confirmed with Braai Brothers", "Ice & drinks stocked", "Bar area shaded", "Playlist / DJ brief sent", "Enough seating for the crowd", "Bins & clean-up crew"],
};
const DEFAULT_CHECKLIST = ["Confirm final numbers 48h before", "Clear delivery & access", "Power available on site", "Someone on site to receive delivery", "Wet-weather backup considered", "Pack-down time agreed"];

const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };

// Ported exactly from stitchd-v9.jsx lines 2168-2300.
export function StitchIt() {
  const { T, pal } = useTheme();
  const { basket, setBasket } = useProtoState();
  const [hireCat, setHireCat] = useState("all");
  const [hireQ, setHireQ] = useState("");
  const [subscriber, setSubscriber] = useState(false);
  const [hireDate, setHireDate] = useState("Sat 2 Aug");
  const [occasion, setOccasion] = useState<string | null>(null);
  const [printDoc, setPrintDoc] = useState<PrintDoc | null>(null);
  const [toasts, setToasts] = useState<{ id: string; m: string; tone: string }[]>([]);
  // Featured/verified badges now come from the real Supplier Portal lens
  // (ops/admin Boost + Verify actions) via the same name-keyed live-status
  // hook Suppliers.tsx/Squad.tsx already use — this is the other half of the
  // "upsell loop" the portal's footer note promises.
  const live = useLiveSupplierStatus();
  const [checkingOut, setCheckingOut] = useState(false);
  const [paying, setPaying] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");

  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  function toast(m: string, tone = "good") {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, m, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3600);
  }

  const byHire = (id: string) => HIRE.find((h) => h.id === id);

  function addToBasket(id: string, addon?: string) {
    const already = !!basket[id];
    setBasket((b) => {
      const cur = b[id] || { qty: 1, addons: [] as string[] };
      const addons = addon ? (cur.addons.includes(addon) ? cur.addons.filter((a) => a !== addon) : [...cur.addons, addon]) : cur.addons;
      return { ...b, [id]: { ...cur, addons } };
    });
    if (!already) toast(`${byHire(id)?.name} added to your quote`);
  }
  function setQty(id: string, d: number) {
    setBasket((b) => {
      const cur = b[id];
      if (!cur) return b;
      const qty = cur.qty + d;
      if (qty <= 0) { const n = { ...b }; delete n[id]; return n; }
      return { ...b, [id]: { ...cur, qty } };
    });
  }
  function removeItem(id: string) {
    setBasket((b) => { const n = { ...b }; delete n[id]; return n; });
  }
  function addOccasion(occ: (typeof OCCASIONS)[number]) {
    const add: Basket = {};
    occ.items.forEach((id) => { add[id] = { qty: 1, addons: [] }; });
    setBasket((b) => ({ ...b, ...add }));
    setOccasion(occ.k);
    toast(`${occ.label} starter added — ${occ.items.length} suppliers, ${randR(occ.save)} bundled saving`);
  }
  function openPrint(doc: PrintDoc) {
    setPrintDoc(doc);
  }
  function doPrint() {
    try { window.print(); } catch { toast("Use your browser's print / save-as-PDF", "warn"); }
  }

  const basketRows = useMemo(
    () => Object.entries(basket).map(([id, v]) => {
      const h = byHire(id);
      if (!h) return null;
      const addonSum = v.addons.reduce((a, name) => { const f = h.addons.find((x) => x[0] === name); return a + (f ? f[1] : 0); }, 0);
      return { ...h, qty: v.qty, addons: v.addons, addonSum, line: h.price * v.qty + addonSum };
    }).filter((r): r is NonNullable<typeof r> => r != null),
    [basket],
  );
  const cart = useMemo(() => {
    const sub = basketRows.reduce((a, r) => a + r.line, 0);
    const n = basketRows.length;
    const bundlePct = n >= 4 ? 0.08 : n >= 3 ? 0.04 : 0;
    const bundleSave = Math.round(sub * bundlePct);
    const afterBundle = sub - bundleSave;
    const memberSave = subscriber ? Math.round(afterBundle * SUB.pct) : 0;
    const delivery = n === 0 ? 0 : subscriber ? 0 : SUB.delivery;
    const total = afterBundle - memberSave + delivery;
    const potentialMember = Math.round(afterBundle * SUB.pct) + (n ? SUB.delivery : 0);
    return { sub, n, bundlePct, bundleSave, memberSave, delivery, total, potentialMember };
  }, [basketRows, subscriber]);

  // FR-BOOK-01/FR-PAY-01: turns the basket into a real order + a real
  // Paystack checkout, instead of the print-only "Book & get quote" above.
  // HIRE items only carry the prototype's local "h1" ids, so items are
  // matched to their real supplier row by name (the 14 hire suppliers were
  // seeded with these exact names — see 20260811110000_orders_money_path.sql)
  // rather than trusting any id from the client.
  async function payNow() {
    if (!custName.trim() || !custPhone.trim()) {
      toast("Add your name and phone to pay", "warn");
      return;
    }
    setPaying(true);
    try {
      const names = [...new Set(basketRows.map((r) => r.name))];
      const { data: matched, error: matchErr } = await supabase.from("suppliers").select("id, name").in("name", names);
      if (matchErr) throw new Error(matchErr.message);
      const idByName = new Map((matched ?? []).map((s) => [s.name, s.id]));

      const items = basketRows.map((r) => {
        const supplier_id = idByName.get(r.name);
        if (!supplier_id) throw new Error(`${r.name} isn't in the live catalog yet`);
        return { supplier_id, qty: r.qty, addon_cents: Math.round(r.addonSum * 100) };
      });

      const order = await createOrder({
        items,
        subscriber,
        occasion: occasion ?? undefined,
        hire_date: hireDate,
        customer_name: custName.trim(),
        customer_phone: custPhone.trim(),
        customer_email: custEmail.trim() || undefined,
      });
      toast(`Order ${order.ref} created — redirecting to pay ${randR(order.total_cents / 100)}...`);

      const checkout = await checkoutOrder(order.ref);
      window.location.href = checkout.checkout_url;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Checkout failed", "warn");
    } finally {
      setPaying(false);
    }
  }

  const items = HIRE
    .filter((h) => hireCat === "all" || h.cat === hireCat)
    .filter((h) => hireQ === "" || `${h.name} ${h.area} ${h.blurb} ${HIRE_CATS.find((c) => c.k === h.cat)?.label}`.toLowerCase().includes(hireQ.toLowerCase()))
    .sort((a, b) => Number(!!live.get(b.name)?.featured) - Number(!!live.get(a.name)?.featured) || Number(!!live.get(b.name)?.verified) - Number(!!live.get(a.name)?.verified) || b.rating - a.rating);
  const catMeta = (k: string) => HIRE_CATS.find((c) => c.k === k)!;
  const activeOccasion = occasion ? OCCASIONS.find((x) => x.k === occasion) : null;

  return (
    <div className="rise flex flex-col gap-3">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: rgba(T.gold, 0.4), background: `linear-gradient(120deg, ${rgba(T.accent, 0.18)}, ${rgba(T.gold, 0.12)})` }}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-1.5"><ShoppingBag size={14} style={{ color: T.gold }} /><span style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 11, letterSpacing: 1, color: T.gold }}>STITCH IT · ON-DEMAND</span></div>
            <div className="mt-1" style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 25, fontWeight: 600, lineHeight: 1.05, color: T.ink }}>Need it this weekend?<br />Hire it. Stitch it. Done.</div>
            <div className="mt-1.5 max-w-lg text-sm" style={{ color: T.sub }}>No planning, no phone calls. Pick what you need from vetted Joburg suppliers, see the price instantly, and book. Party, funeral, braai — just stitch it.</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold" style={{ color: T.sub }}>I'm sorting a…</span>
              {OCCASIONS.map((o) => (
                <button key={o.k} onClick={() => addOccasion(o)} className="press flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold" style={occasion === o.k ? { background: T.gold, color: T.onGold } : { background: T.panel, color: T.ink, border: `1px solid ${T.border}` }}>
                  <o.I size={12} />{o.label}
                </button>
              ))}
            </div>
            {activeOccasion && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs" style={{ background: rgba(T.gold, 0.12), color: T.gold }}>
                <Zap size={12} className="mt-0.5 shrink-0" />
                <span><b>{activeOccasion.label} starter</b> dropped in your quote — {activeOccasion.line} You're already saving {randR(activeOccasion.save)}.</span>
              </div>
            )}
          </div>
        </div>

        {!subscriber && (
          <button onClick={() => { setSubscriber(true); toast("Stitched+ preview on — watch your quote drop"); }} className="press lift flex w-full items-center gap-3 rounded-2xl border p-3 text-left" style={{ borderColor: rgba(T.accent, 0.4), background: T.panel }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: rgba(T.accent, 0.14) }}><Percent size={18} style={{ color: T.accent }} /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Become a <span style={{ color: T.accent }}>Stitched+</span> member — {randR(SUB.price)}/mo</div>
              <div className="text-xs" style={{ color: T.sub }}>
                Save {Math.round(SUB.pct * 100)}% on every booking · free delivery · priority weekend slots.
                {cart.n > 0 && <b style={{ color: T.good }}> You'd save {randR(cart.potentialMember)} on this quote alone.</b>}
              </div>
            </div>
            <span className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold" style={btnA}>Try it free</span>
          </button>
        )}
        {subscriber && (
          <div className="flex items-center gap-2 rounded-2xl border p-2.5 text-xs font-bold" style={{ borderColor: rgba(T.good, 0.4), color: T.good, background: rgba(T.good, 0.06) }}>
            <BadgeCheck size={15} />Stitched+ preview active — {Math.round(SUB.pct * 100)}% off + free delivery applied.
            <button onClick={() => setSubscriber(false)} className="ml-auto rounded px-2 py-0.5" style={{ color: T.sub, background: T.panel2 }}>Turn off</button>
          </div>
        )}

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setHireCat("all")} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold press" style={hireCat === "all" ? btnA : { color: T.sub, background: T.panel2 }}>All</button>
          {HIRE_CATS.map((c) => (
            <button key={c.k} onClick={() => setHireCat(c.k)} className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold press" style={hireCat === c.k ? btnA : { color: T.sub, background: T.panel2 }}>
              <c.I size={12} />{c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={inputS}>
          <ShoppingCart size={14} style={{ color: T.faint }} />
          <input value={hireQ} onChange={(e) => setHireQ(e.target.value)} placeholder="Search: marquee, DJ, braai, jumping castle…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" style={{ color: T.ink }} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((h) => {
            const cm = catMeta(h.cat);
            const inBasket = !!basket[h.id];
            return (
              <div key={h.id} className="overflow-hidden rounded-2xl border" style={{ background: T.panel, borderColor: inBasket ? rgba(T.good, 0.5) : T.border, borderWidth: inBasket ? 2 : 1 }}>
                <div className="relative">
                  <Shot cat={h.id === "h2" ? "marquee2" : h.id === "h4" ? "seating2" : h.cat} seed={h.id} T={T} pal={pal} h={130} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(6,6,12,.82))" }} />
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: rgba("#0A0A0E", 0.6), color: "#fff", fontSize: 9.5, fontWeight: 700 }}><cm.I size={10} />{cm.label}</span>
                  {live.get(h.name)?.featured && <span className="absolute left-2 top-9 flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: T.gold, color: T.onGold, fontSize: 8.5, fontWeight: 800 }}><TrendingUp size={9} />FEATURED</span>}
                  <span className="absolute right-2 top-2 flex flex-col items-end gap-1">
                    <span className="rounded-full px-2 py-0.5" style={{ background: h.avail.includes("weekend") ? rgba(T.good, 0.9) : rgba(T.warn, 0.9), color: "#fff", fontSize: 9, fontWeight: 800 }}>{h.avail}</span>
                    {live.get(h.name)?.verified && <span className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5" style={{ background: rgba(T.info, 0.95), color: "#fff", fontSize: 8.5, fontWeight: 800 }}><BadgeCheck size={9} />VERIFIED</span>}
                  </span>
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between">
                    <div>
                      <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 13, color: "#fff", lineHeight: 1 }}>{h.name}</div>
                      <div className="flex items-center gap-1" style={{ fontSize: 10, color: rgba("#fff", 0.8) }}><MapPin size={9} />{h.area} · {cm.tag}</div>
                    </div>
                    <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5" style={{ background: rgba("#0A0A0E", 0.55), color: T.gold, fontSize: 10, fontWeight: 800 }}><Star size={9} fill="currentColor" />{h.rating}</span>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="text-xs" style={{ color: T.sub, minHeight: 32 }}>{h.blurb}</div>
                  <div className="mt-1.5 flex items-end justify-between">
                    <div><span className="tnum" style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 16, color: T.ink }}>{randR(h.price)}</span><span style={{ fontSize: 10, color: T.faint }}> /{h.unit}</span></div>
                    <span className="text-xs" style={{ color: T.faint }}>{h.reviews} reviews</span>
                  </div>
                  {h.addons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {h.addons.map(([name, cost]) => {
                        const on = (basket[h.id]?.addons || []).includes(name);
                        return (
                          <button key={name} onClick={() => { if (!inBasket) addToBasket(h.id); addToBasket(h.id, name); }} className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ fontSize: 9.5, fontWeight: 700, border: `1px solid ${on ? T.good : T.border}`, background: on ? rgba(T.good, 0.14) : T.panel2, color: on ? T.good : T.sub }}>
                            {on ? <Check size={9} /> : <Plus size={9} />}{name} {randR(cost)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!inBasket ? (
                    <button onClick={() => addToBasket(h.id)} className="press mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold" style={btnA}><Plus size={13} />Add to quote</button>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-lg" style={{ background: T.panel2 }}>
                        <button onClick={() => setQty(h.id, -1)} className="px-2 py-1.5" style={{ color: T.sub }}><Minus size={12} /></button>
                        <span className="tnum text-xs font-bold" style={{ minWidth: 16, textAlign: "center" }}>{basket[h.id].qty}</span>
                        <button onClick={() => setQty(h.id, 1)} className="px-2 py-1.5" style={{ color: T.sub }}><Plus size={12} /></button>
                      </div>
                      <span className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold" style={{ background: rgba(T.good, 0.14), color: T.good }}><Check size={12} />In quote</span>
                      <button onClick={() => removeItem(h.id)} aria-label="remove" className="rounded-lg px-2 py-1.5" style={btnG}><X size={12} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {items.length === 0 && <Card T={T} className="text-center text-sm sm:col-span-2 xl:col-span-3" style={{ color: T.sub }}>Nothing here yet. Try another category or search.</Card>}
        </div>
      </div>

      <div>
          <Card T={T}>
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} style={{ color: T.accent }} />
              <span className="text-sm font-bold">Your instant quote</span>
              <span className="ml-auto rounded-full px-1.5 py-0.5 tnum" style={{ fontSize: 10, fontWeight: 800, background: rgba(T.accent, 0.14), color: T.accent }}>{cart.n}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: T.sub }}>
              <CalendarCheck size={11} />Hire date:
              <select value={hireDate} onChange={(e) => setHireDate(e.target.value)} className="rounded px-1 py-0.5 text-xs" style={inputS}>
                {["Sat 2 Aug", "Sun 3 Aug", "Sat 9 Aug", "Sat 16 Aug"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            {cart.n === 0 ? (
              <div className="py-6 text-center text-xs" style={{ color: T.faint }}>Your quote's empty. Tap a starter above or add items — no commitment, see the price build live.</div>
            ) : (
              <>
                <div className="mt-2 space-y-1.5" style={{ maxHeight: 230, overflowY: "auto" }}>
                  {basketRows.map((r) => (
                    <div key={r.id} className="rounded-lg p-1.5" style={{ background: T.panel2 }}>
                      <div className="flex items-center gap-1.5">
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold">{r.name}{r.qty > 1 ? ` ×${r.qty}` : ""}</span>
                        <span className="tnum text-xs font-bold">{randR(r.line)}</span>
                        <button onClick={() => removeItem(r.id)} aria-label="remove" style={{ color: T.faint }}><X size={11} /></button>
                      </div>
                      {r.addons.length > 0 && <div className="truncate" style={{ fontSize: 9.5, color: T.gold }}>+ {r.addons.join(", ")}</div>}
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-1 border-t pt-2 text-xs" style={{ borderColor: T.border }}>
                  <div className="flex justify-between" style={{ color: T.sub }}><span>Subtotal</span><span className="tnum">{randR(cart.sub)}</span></div>
                  {cart.bundleSave > 0 && <div className="flex justify-between" style={{ color: T.good }}><span>Bundle saving ({Math.round(cart.bundlePct * 100)}% · {cart.n} suppliers)</span><span className="tnum">−{randR(cart.bundleSave)}</span></div>}
                  {subscriber && <div className="flex justify-between" style={{ color: T.accent }}><span>Stitched+ ({Math.round(SUB.pct * 100)}%)</span><span className="tnum">−{randR(cart.memberSave)}</span></div>}
                  <div className="flex justify-between" style={{ color: cart.delivery === 0 ? T.good : T.sub }}><span>Delivery</span><span className="tnum">{cart.delivery === 0 ? "FREE" : randR(cart.delivery)}</span></div>
                  <div className="flex justify-between border-t pt-1 text-sm font-bold" style={{ borderColor: T.border }}><span>Total</span><span className="tnum" style={{ color: T.gold }}>{randR(cart.total)}</span></div>
                </div>
                {!subscriber && cart.potentialMember > 0 && (
                  <button onClick={() => { setSubscriber(true); toast("Stitched+ applied"); }} className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold" style={{ background: rgba(T.accent, 0.12), color: T.accent }}>
                    <Percent size={12} />Join Stitched+ and save {randR(cart.potentialMember)} now
                  </button>
                )}
                <button onClick={() => openPrint({ kind: "quote" })} className="press mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold" style={btnA}><BadgeCheck size={14} />Book &amp; get quote</button>
                <div className="mt-1.5 flex gap-1.5">
                  <button onClick={() => openPrint({ kind: "quote" })} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold" style={btnG}><Printer size={12} />Print quote</button>
                  <button onClick={() => openPrint({ kind: "checklist" })} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold" style={btnG}><ClipboardCheck size={12} />Event checklist</button>
                </div>
                {!checkingOut ? (
                  <button onClick={() => setCheckingOut(true)} className="press mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold" style={{ background: rgba(T.good, 0.14), color: T.good }}>
                    <ShoppingCart size={12} />Pay now — real checkout
                  </button>
                ) : (
                  <div className="mt-2 space-y-1.5 rounded-lg border p-2" style={{ borderColor: T.border }}>
                    <div className="text-xs font-bold" style={{ color: T.sub }}>Your details</div>
                    <input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="Your name" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
                    <input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="Your phone" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
                    <input value={custEmail} onChange={(e) => setCustEmail(e.target.value)} placeholder="Email (optional)" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
                    <button onClick={payNow} disabled={paying} className="press flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold" style={btnA}>
                      {paying ? "Working..." : `Pay ${randR(cart.total)} with Paystack`}
                    </button>
                  </div>
                )}
              </>
            )}
          </Card>
          <Card T={T} className="mt-3">
            <div className="flex items-center gap-1.5"><TrendingUp size={13} style={{ color: T.gold }} /><span className="text-xs font-bold" style={{ color: T.sub, letterSpacing: 0.5 }}>TODAY ON STITCHD</span></div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {([["R48 200", "booked"], ["12", "orders"], ["R4 016", "avg basket"]] as [string, string][]).map(([v, l]) => (
                <div key={l}><div className="tnum" style={{ ...bigNum, fontSize: 15, color: T.gold }}>{v}</div><div style={{ fontSize: 9, color: T.faint }}>{l}</div></div>
              ))}
            </div>
            <div className="mt-1.5 text-xs" style={{ color: T.faint }}>Every hire earns Stitchd a 12% service fee — revenue between the big events.</div>
          </Card>
      </div>

      {toasts.length > 0 && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[55] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
          {toasts.map((t) => (
            <div key={t.id} className="rise flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold" style={{ background: T.panel, borderColor: rgba(t.tone === "good" ? T.good : T.warn, 0.5), color: T.ink, boxShadow: T.shadow }}>
              {t.tone === "good" ? <CheckCircle2 size={15} style={{ color: T.good }} /> : <AlertTriangle size={15} style={{ color: T.warn }} />}
              <span className="min-w-0 flex-1">{t.m}</span>
            </div>
          ))}
        </div>
      )}

      {printDoc && (() => {
        const occ = occasion ? OCCASIONS.find((o) => o.k === occasion) : null;
        const checklist = (occasion && CHECKLISTS[occasion]) || DEFAULT_CHECKLIST;
        return (
          <div className="fixed inset-0 z-[70] flex justify-center overflow-y-auto" style={{ background: "rgba(5,5,10,0.7)" }}>
            <div className="no-print absolute right-4 top-4 flex gap-2">
              <button onClick={doPrint} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold" style={{ background: "#fff", color: "#111" }}><Printer size={14} />Print / Save PDF</button>
              <button onClick={() => setPrintDoc(null)} className="rounded-lg px-3 py-2 text-sm font-bold" style={{ background: rgba("#fff", 0.15), color: "#fff" }}>Close</button>
            </div>
            <div className="print-area my-6 h-fit w-full max-w-2xl rounded-xl bg-white p-8 text-[#111]" style={{ fontFamily: "'Manrope',system-ui,sans-serif" }}>
              <div className="flex items-center justify-between border-b-2 pb-3" style={{ borderColor: "#111" }}>
                <div>
                  <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 22 }}>STITCHD</div>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#666" }}>EVENTS, STITCHED TOGETHER</div>
                </div>
                <div className="text-right" style={{ fontSize: 11, color: "#444" }}>
                  {printDoc.kind === "quote" ? "INSTANT HIRE QUOTE" : "EVENT-DAY CHECKLIST"}<br />
                  {hireDate} · {new Date().toLocaleDateString("en-ZA")}<br />
                  Quote #ST-{Math.floor(10000 + (hash(hireDate + cart.n) % 89999))}
                </div>
              </div>

              {printDoc.kind === "quote" ? (
                <>
                  <div className="mt-4 mb-2 text-sm" style={{ color: "#444" }}>Prepared for <b style={{ color: "#111" }}>Junior &amp; Nadine</b> · delivery to Oakfield Farm, Muldersdrift{occ ? ` · ${occ.label} package` : ""}.</div>
                  <table className="w-full" style={{ fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left", color: "#666" }}>
                        <th className="py-1.5">Supplier</th><th>Area</th><th style={{ textAlign: "center" }}>Qty</th><th style={{ textAlign: "right" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {basketRows.map((r) => (
                        <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                          <td className="py-1.5"><b>{r.name}</b>{r.addons.length ? <div style={{ fontSize: 10, color: "#777" }}>+ {r.addons.join(", ")}</div> : null}</td>
                          <td style={{ color: "#666" }}>{r.area}</td>
                          <td style={{ textAlign: "center" }}>{r.qty}</td>
                          <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{randR(r.line)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 ml-auto w-64" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                    <div className="flex justify-between py-0.5"><span style={{ color: "#666" }}>Subtotal</span><span>{randR(cart.sub)}</span></div>
                    {cart.bundleSave > 0 && <div className="flex justify-between py-0.5" style={{ color: "#178A57" }}><span>Bundle saving</span><span>−{randR(cart.bundleSave)}</span></div>}
                    {subscriber && <div className="flex justify-between py-0.5" style={{ color: "#6A57E0" }}><span>Stitched+ discount</span><span>−{randR(cart.memberSave)}</span></div>}
                    <div className="flex justify-between py-0.5"><span style={{ color: "#666" }}>Delivery</span><span>{cart.delivery === 0 ? "FREE" : randR(cart.delivery)}</span></div>
                    <div className="mt-1 flex justify-between border-t-2 pt-1 text-base font-bold" style={{ borderColor: "#111" }}><span>Total</span><span>{randR(cart.total)}</span></div>
                  </div>
                  {!subscriber && cart.potentialMember > 0 && (
                    <div className="mt-3 rounded-lg p-2.5 text-xs" style={{ background: "#F3F1FB", color: "#4B3F8F" }}>
                      <b>Stitched+ members would save {randR(cart.potentialMember)} on this quote</b> — {Math.round(SUB.pct * 100)}% off every booking plus free delivery, for {randR(SUB.price)}/month.
                    </div>
                  )}
                  <div className="mt-4 text-xs" style={{ color: "#888" }}>Valid 7 days · prices held for {hireDate} · a 25% deposit confirms your booking. Simulated demo quote — suppliers are illustrative Joburg businesses.</div>
                </>
              ) : (
                <>
                  <div className="mt-4 mb-3 text-sm" style={{ color: "#444" }}>{occ ? `${occ.label} run-sheet` : "Event run-sheet"} for {hireDate}. Tick these off and the day runs itself.</div>
                  {basketRows.length > 0 && (
                    <div className="mb-3">
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1 }}>YOUR BOOKED SUPPLIERS</div>
                      {basketRows.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 py-1" style={{ fontSize: 12, borderBottom: "1px solid #f0f0f0" }}>
                          <span style={{ width: 14, height: 14, border: "1.5px solid #111", borderRadius: 3, display: "inline-block" }} />
                          <b>{r.name}</b> — {HIRE_CATS.find((c) => c.k === r.cat)?.label} · {r.area}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: 1 }}>BEFORE THE DAY</div>
                  {checklist.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5" style={{ fontSize: 12.5, borderBottom: "1px solid #f0f0f0" }}>
                      <span style={{ width: 16, height: 16, border: "1.5px solid #111", borderRadius: 3, display: "inline-block" }} />{c}
                    </div>
                  ))}
                  <div className="mt-4 text-xs" style={{ color: "#888" }}>Generated by STITCHD · {occ ? occ.label : "Event"} checklist · print and stick it on the fridge.</div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
