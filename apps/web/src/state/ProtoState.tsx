import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "../theme/ThemeContext";
import { SwipeToast } from "../components/proto/SwipeToast";
import { PALETTES } from "../theme/palettes";
import { rolesFor } from "../components/proto/readiness";
import { SUPPLIERS_SEED, GUESTS_SEED, TABLES_SEED, REGISTRY_SEED, WEDDING, PER_HEAD, fmtR, randR, type Supplier, type Candidate } from "../components/proto/data";
import { supabase } from "../lib/supabase";
import { useLiveSupplierTickets, type TicketStatus } from "./useLiveSupplierTickets";
import { useTasks, type Task } from "./useTasks";

export type Guest = (typeof GUESTS_SEED)[number];
export type Table = (typeof TABLES_SEED)[number];
export type { Task };
export type RegistryItem = (typeof REGISTRY_SEED)[number];
export type RsvpVal = "yes" | "no" | "pending";
export type ChangeReq = { id: string; sup: string; role: string; delta: number; headcount: number; perHead: number; amount: number; status: "pending" | "approved" | "declined" };
export type Msg = { who: string; t: string; m: string; act?: { l: string; go: () => void } };
export type Profile = { etype: string; prior: Set<string>; supp: string; comm: "WhatsApp" | "Email" | "Call"; budget: number };
export type OnboardingResult = { etype: string; prior: string[]; supp: string; comm: "WhatsApp" | "Email" | "Call"; budget: number; pal: number; guests: number; eventDate: string };
export type Basket = Record<string, { qty: number; addons: string[] }>;
export type ExtraBudgetItem = { id: string; cat: string; label: string; cost: number; need: number; paid: boolean };
type Toast = { id: string; m: string; tone: string; onUndo?: () => void };

const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const DEFAULT_PROFILE: Profile = { etype: "Wedding", prior: new Set(["Food & Catering", "Music & Entertainment", "Décor & Flowers"]), supp: "Full planning support", comm: "WhatsApp", budget: 400 };

interface ProtoStateValue {
  sup: Supplier[]; setSup: React.Dispatch<React.SetStateAction<Supplier[]>>;
  gList: Guest[]; setGList: React.Dispatch<React.SetStateAction<Guest[]>>;
  tables: Table[]; setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  tasks: Task[]; addTask: (title: string, owner?: string) => Promise<void>; completeTask: (id: string, currentSt: Task["st"]) => Promise<void>;
  registry: RegistryItem[]; setRegistry: React.Dispatch<React.SetStateAction<RegistryItem[]>>;
  budgetCap: number; setBudgetCap: (n: number) => void;
  pinned: Set<string>; setPinned: React.Dispatch<React.SetStateAction<Set<string>>>;
  extraBudgetItems: ExtraBudgetItem[];
  addBudgetItem: (cat: string, label: string, cost: number) => void;
  bundleApplied: boolean;
  msgs: Msg[]; setMsgs: React.Dispatch<React.SetStateAction<Msg[]>>;
  chased: boolean;
  toasts: Toast[];
  toast: (m: string, tone?: string, onUndo?: () => void) => void;
  secure: (id: string) => void;
  swapCandidate: (role: string, c: Candidate) => void;
  moveZone: (id: string) => void;
  applyBundle: () => void;
  setRsvp: (id: string, val: RsvpVal) => void;
  toggleGuestNeed: (id: string, need: string) => void;
  markReminded: (id: string) => void;
  chaseRsvp: () => void;
  channelLink: (g: Guest) => string;
  changeReqs: ChangeReq[];
  headcountBase: number;
  raiseChangeReqs: () => void;
  resolveChange: (id: string, ok: boolean) => void;
  guests: number; setGuests: (n: number) => void;
  profile: Profile;
  eventId: string | null;
  showOnb: boolean; setShowOnb: (b: boolean) => void;
  finishOnboarding: (p: OnboardingResult) => void;
  // Lifted out of Stitch It so the nav tab badge (cart item count) can read
  // it without that lens being mounted.
  basket: Basket; setBasket: React.Dispatch<React.SetStateAction<Basket>>;
  // Which supplier's drawer is open — read by AppShell so FutCard clicks in
  // any lens (Squad, Suppliers) can open the same shared drawer.
  selSup: string | null; setSelSup: (id: string | null) => void;
  // Readiness ("Path to 100") drawer — opened from Squad's Readiness card
  // and Chat's "Show the maths" action.
  readyOpen: boolean; setReadyOpen: (b: boolean) => void;
  // Coach brief sheet — which non-live client's brief is open.
  coachSel: string | null; setCoachSel: (id: string | null) => void;
}

const Ctx = createContext<ProtoStateValue | null>(null);

export function ProtoStateProvider({
  children,
  initialShowOnb = true,
  ownerId,
}: {
  children: ReactNode;
  // Both optional so anything that doesn't pass them (there's none left,
  // but keeps this safe to reuse) behaves exactly as before: wizard shows.
  // Entry.tsx passes initialShowOnb={hasEvent already exists for this
  // account} and its own session's user id as ownerId, so finishOnboarding
  // below can write a real, owned events row instead of only local state.
  initialShowOnb?: boolean;
  ownerId?: string;
}) {
  const { T, setPal } = useTheme();
  const [sup, setSup] = useState<Supplier[]>(SUPPLIERS_SEED);
  const [gList, setGList] = useState<Guest[]>(GUESTS_SEED);
  const [tables, setTables] = useState<Table[]>(TABLES_SEED);
  const [registry, setRegistry] = useState<RegistryItem[]>(REGISTRY_SEED);
  const [budgetCap, setBudgetCap] = useState(400);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [extraBudgetItems, setExtraBudgetItems] = useState<ExtraBudgetItem[]>([]);
  function addBudgetItem(cat: string, label: string, cost: number) {
    setExtraBudgetItems((items) => [...items, { id: `bx${Date.now()}`, cat, label, cost, need: 5, paid: false }]);
    toast(`${label} added to ${cat}`);
  }
  const [bundleApplied, setBundleApplied] = useState(false);
  const [chased, setChased] = useState(false);
  const [changeReqs, setChangeReqs] = useState<ChangeReq[]>([]);
  const [headcountBase, setHeadcountBase] = useState(140);
  const [guests, setGuests] = useState(140);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [showOnb, setShowOnb] = useState(initialShowOnb);
  // The one real per-account row this app has (written once by
  // finishOnboarding below) — exposed so real backend-scoped features have
  // something real to key off. Budget payment reconciliation and tasks
  // (below) are both real now; guests/squad still deliberately run on the
  // shared demo data (the real guest/supplier backends live at
  // /rsvp-manager and the Supplier Portal, not wired into these lenses).
  const [eventId, setEventId] = useState<string | null>(null);
  useEffect(() => {
    if (!ownerId) return;
    supabase.from("events").select("id").eq("owner_id", ownerId).maybeSingle().then(({ data }) => {
      if (data) setEventId(data.id);
    });
  }, [ownerId]);
  const { tasks, addTask, completeTask } = useTasks(eventId);
  const [basket, setBasket] = useState<Basket>({});
  const [selSup, setSelSup] = useState<string | null>(null);
  const [readyOpen, setReadyOpen] = useState(false);
  const [coachSel, setCoachSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: "Lungi", t: "09:12", m: "Morning you two! Squad's looking strong. Two flags today: Taste Affair has a date clash, and 5 RSVPs are still open. \u{1F33F}" },
    { who: "Nadine", t: "09:15", m: "On it! Invites go out tonight." },
  ]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const coreN = guests < 80 ? 5 : guests <= 150 ? 6 : guests <= 250 ? 8 : 10;

  function toast(m: string, tone = "good", onUndo?: () => void) {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, m, tone, onUndo }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), onUndo ? 6000 : 3600);
  }

  // Side effects (toast/setMsgs) live outside the setSup/setGList updater
  // callbacks below — React StrictMode double-invokes updater functions in
  // dev to catch impurities, which was firing every toast twice.
  function secure(id: string) {
    const s = sup.find((x) => x.id === id);
    if (!s) return;
    if (s.status === "confirmed") toast(`${s.name} un-confirmed`, "warn");
    else if (s.status === "issue") toast(`${s.name} issue resolved — confirmed`);
    else toast(`${s.name} confirmed for 14 Nov`);
    setSup((ss) => ss.map((x) => {
      if (x.id !== id) return x;
      if (x.status === "confirmed") return { ...x, status: "pending" as const };
      if (x.status === "issue") return { ...x, status: "confirmed" as const, issueNote: undefined };
      return { ...x, status: "confirmed" as const };
    }));
  }

  // Real supplier_tickets rows are the source of truth for "did the supplier
  // actually say yes or no" — this reconciles that into the local `sup.status`
  // shown everywhere (Squad, drawers, readiness), one-way, so a ticket
  // resolving anywhere in Supabase (the couple requesting it, the supplier's
  // own portal, or an admin acting for them) reflects back into the app the
  // couple is looking at, live, regardless of which screen is open. Mounted
  // once here (not per-lens) so it keeps working even while the couple is on
  // an unrelated tab when the supplier responds.
  const tickets = useLiveSupplierTickets();
  const appliedTicketStatus = useRef(new Map<string, TicketStatus["status"]>());
  useEffect(() => {
    tickets.forEach((t, name) => {
      const prev = appliedTicketStatus.current.get(name);
      appliedTicketStatus.current.set(name, t.status);
      if (t.status !== "confirmed" && t.status !== "declined") return;
      // Only announce with a toast for a transition witnessed live this
      // session (prev existed and differs) — a ticket that was already
      // resolved before this page load reconciles silently on first sight.
      applyTicketOutcome(name, t.status, prev !== undefined && prev !== t.status);
    });
  }, [tickets]);

  function applyTicketOutcome(supplierName: string, outcome: "confirmed" | "declined", announce: boolean) {
    const s = sup.find((x) => x.name === supplierName);
    if (!s) return;
    if (outcome === "confirmed") {
      if (s.status === "confirmed") return;
      if (announce) toast(`${supplierName} confirmed — ticket resolved`);
      setSup((ss) => ss.map((x) => (x.name === supplierName ? { ...x, status: "confirmed" as const, issueNote: undefined } : x)));
    } else {
      if (s.status === "confirmed" || s.status === "issue") return;
      if (announce) toast(`${supplierName} needs your attention — they said no`, "warn");
      setSup((ss) => ss.map((x) => (x.name === supplierName ? { ...x, status: "issue" as const, issueNote: "Declined your confirmation request — check in with them." } : x)));
    }
  }

  // Suppliers > Find someone's "Book" action. Every role already has exactly
  // one supplier (see the Candidate interface's own comment in data.ts), so
  // booking a candidate really does swap it in for that role's current
  // pending pick, not add a second one — the caller (Marketplace.tsx) raises
  // the real supplier_tickets row via createSupplierTicket first, and only
  // calls this once that succeeds, so local state never claims a booking
  // that didn't really go through.
  function swapCandidate(role: string, c: Candidate) {
    setSup((ss) => ss.map((x) => (x.role === role
      ? { id: c.id, role: c.role, name: c.name, sub: `${c.style} · ${c.area}`, price: c.price, rating: c.rating, reviews: c.reviews, resp: c.respHours, onTime: 92, rebook: 85, status: "pending" as const, zone: "bench" as const }
      : x)));
    toast(`${c.name} booked — ticket sent, waiting on their reply`);
  }

  function moveZone(id: string) {
    const s = sup.find((x) => x.id === id);
    if (!s) return;
    const coreLen = sup.filter((x) => x.zone === "core").length;
    if (s.zone === "bench" && coreLen >= coreN) toast(`Core is at its recommended ${coreN} for ${guests} guests`, "warn");
    setSup((ss) => ss.map((x) => (x.id === id ? { ...x, zone: x.zone === "core" ? ("bench" as const) : ("core" as const) } : x)));
  }

  function applyBundle() {
    if (bundleApplied) return;
    setBundleApplied(true);
    toast("Oakfield package applied — Catering, DJ & Décor included, R71k saved \u{1F389}");
    setSup((ss) => ss.map((s) => (s.role === "Catering" || s.role === "Entertainment" || s.role === "Décor Supplier") ? { ...s, status: "confirmed" as const, viaBundle: true } : s));
    setMsgs((m) => [...m, { who: "Lungi", t: now(), m: "Smart — Oakfield's in-house package folds Catering, DJ, Décor, lighting and furniture under one contract. That's R71k saved versus separate bookings and three fewer suppliers to chase. Applied. \u{1F49C}" }]);
  }

  function setRsvp(id: string, val: RsvpVal) {
    const g = gList.find((x) => x.id === id);
    if (g) {
      if (val === "yes" && g.rsvp !== "yes") toast(`${g.name} confirmed · ${g.party} seat${g.party > 1 ? "s" : ""} added to the catering count`);
      if (val === "no" && g.rsvp !== "no") toast(`${g.name} declined · ${g.party} seat${g.party > 1 ? "s" : ""} released`, "warn");
    }
    setGList((gs) => gs.map((x) => (x.id === id ? { ...x, rsvp: val } : x)));
  }

  function toggleGuestNeed(id: string, need: string) {
    setGList((gs) =>
      gs.map((x) => {
        if (x.id !== id) return x;
        const has = x.needs.some(([k]) => k === need);
        return { ...x, needs: has ? x.needs.filter(([k]) => k !== need) : [...x.needs, [need, 1] as [string, number]] };
      }),
    );
  }

  function rsvpMsg(g: Guest) {
    return `Hi ${g.name.split(" ")[0]}, it's Lungi from VIP Hosting. Junior & Nadine are getting married on Saturday 14 November 2026 at Oakfield Farm, Muldersdrift. We have you down for ${g.party} seat${g.party > 1 ? "s" : ""}. Could you confirm by ${WEDDING.rsvpDeadline}? Let me know any dietary needs and I'll pass them to the caterer.`;
  }

  function channelLink(g: Guest) {
    const m = rsvpMsg(g);
    if (profile.comm === "Email") return `mailto:${g.em}?subject=${encodeURIComponent("RSVP — Junior & Nadine, 14 Nov 2026")}&body=${encodeURIComponent(m)}`;
    if (profile.comm === "Call") return `tel:+${g.ph}`;
    return `https://wa.me/${g.ph}?text=${encodeURIComponent(m)}`;
  }

  function markReminded(id: string) {
    setGList((gs) => gs.map((g) => (g.id === id ? { ...g, rem: g.rem + 1, remAt: now() } : g)));
  }

  function chaseRsvp() {
    const pend = gList.filter((g) => g.rsvp === "pending");
    if (!pend.length) return;
    setChased(true);
    setGList((gs) => gs.map((g) => (g.rsvp === "pending" ? { ...g, rem: g.rem + 1, remAt: now() } : g)));
    toast(`${pend.length} ${profile.comm} reminders queued · round ${Math.max(...pend.map((g) => g.rem)) + 1}`);
    setMsgs((m) => [...m, { who: "Lungi", t: now(), m: `Queued the RSVP reminder round on ${profile.comm} — ${pend.length} households, ${pend.reduce((a, g) => a + g.party, 0)} seats outstanding. Open any guest to send it yourself, or I'll nudge again in 3 days. \u{1F4F2}` }]);
  }

  // Guests added in Seating push headcount past the last supplier-approved
  // base; per-head suppliers (Catering/Cake/Bar) must sign off before the
  // extra cost flows into the budget.
  function raiseChangeReqs() {
    // +1: called via setTimeout from addGuest, so this closure's gList is the
    // pre-addition snapshot from the render that scheduled the timeout — the
    // re-render triggered by that setGList doesn't retroactively update it.
    const heads = gList.filter((g) => g.rsvp !== "no").reduce((a, g) => a + g.party, 0) + 1;
    const delta = heads - headcountBase;
    if (delta === 0) return;
    setChangeReqs((reqs) => {
      const active = new Set(reqs.filter((r) => r.status === "pending").map((r) => r.role));
      const add: ChangeReq[] = [];
      Object.entries(PER_HEAD).forEach(([role, ph]) => {
        if (active.has(role)) return;
        const s = sup.find((x) => x.role === role);
        const supName = s ? s.name : role === "Bar" ? "Tap & Pour (bar)" : role;
        add.push({ id: `cr-${role}-${Date.now()}`, sup: supName, role, delta, headcount: heads, perHead: ph, amount: ph * delta, status: "pending" });
      });
      const merged = reqs.map((r) => (r.status === "pending" && PER_HEAD[r.role] ? { ...r, delta: heads - headcountBase, headcount: heads, amount: r.perHead * (heads - headcountBase) } : r));
      return [...merged, ...add];
    });
  }

  function resolveChange(id: string, ok: boolean) {
    const r = changeReqs.find((x) => x.id === id);
    if (!r) return;
    if (ok) { toast(`${r.sup} approved +${r.delta} — ${randR(r.amount)} added to budget (${randR(r.perHead)}/head)`); setHeadcountBase(r.headcount); }
    else toast(`${r.sup} change declined — headcount stays at ${headcountBase}`, "warn");
    setChangeReqs((reqs) => reqs.map((x) => (x.id === id ? { ...x, status: ok ? ("approved" as const) : ("declined" as const) } : x)));
  }

  // Ported exactly from stitchd-v9.jsx lines 1582-1596 (the Onboarding
  // modal's onDone handler).
  function finishOnboarding(p: OnboardingResult) {
    setShowOnb(false);
    setProfile({ etype: p.etype, prior: new Set(p.prior), supp: p.supp, comm: p.comm, budget: p.budget });
    setBudgetCap(Math.max(280, Math.min(480, p.budget)));
    setPal(p.pal);
    // Real persistence so the wizard never re-fires for this account on the
    // next reload/sign-in — fired after the local setters above so the UI
    // doesn't wait on the network. Not awaited/blocking; Entry re-resolves
    // hasEvent fresh on next mount regardless of this call's timing.
    if (ownerId) {
      supabase
        .from("events")
        .insert({
          owner_id: ownerId,
          type: p.etype,
          guest_count: p.guests,
          event_date: p.eventDate || null,
          budget_cap_cents: Math.round(p.budget * 100),
          palette_index: p.pal,
          priorities: p.prior,
          support_level: p.supp,
          comm_channel: p.comm,
        })
        .select("id")
        .single()
        .then(({ data, error }) => {
          if (error) console.error("finishOnboarding: events insert failed", error);
          else setEventId(data.id);
        });
    } else {
      console.error("finishOnboarding: no ownerId — events row not created");
    }
    const roles = [...rolesFor(new Set(p.prior))];
    const pCoreN = p.guests < 80 ? 5 : p.guests <= 150 ? 6 : p.guests <= 250 ? 8 : 10;
    toast(`Brief applied · ${pCoreN} core roles · cap ${fmtR(p.budget)} · ${PALETTES[p.pal].name}`);
    setMsgs((m) => [...m, {
      who: "Lungi", t: now(),
      m: p.supp === "I'll plan myself"
        ? `Noted — you're driving. I've pushed ${roles.length ? roles.join(", ") : "your suppliers"} to the top of the bench and set the cap at ${fmtR(p.budget)}. Shout when you need me.`
        : p.supp === "I need some guidance"
          ? `Got your brief. ${roles.length ? roles.join(", ") + " now rank first" : "Suppliers ranked"}, cap set to ${fmtR(p.budget)}, and I'll flag decisions rather than make them. First flag: Taste Affair's date clash.`
          : `Brief locked in. I've ranked ${roles.length ? roles.join(", ") : "your suppliers"} first, set the cap to ${fmtR(p.budget)}, and I'm chasing the Taste Affair clash myself. You'll hear from me when it's done. \u{1F49C}`,
    }]);
  }

  const value: ProtoStateValue = {
    sup, setSup, gList, setGList, tables, setTables, tasks, addTask, completeTask, registry, setRegistry,
    budgetCap, setBudgetCap, pinned, setPinned, extraBudgetItems, addBudgetItem, bundleApplied,
    msgs, setMsgs, chased, toasts, toast,
    secure, swapCandidate, moveZone, applyBundle, setRsvp, toggleGuestNeed, markReminded, chaseRsvp, channelLink,
    changeReqs, headcountBase, raiseChangeReqs, resolveChange,
    guests, setGuests, profile, eventId, showOnb, setShowOnb, finishOnboarding,
    basket, setBasket,
    selSup, setSelSup, readyOpen, setReadyOpen, coachSel, setCoachSel,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[55] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
          {toasts.map((t) => (
            <SwipeToast key={t.id} m={t.m} tone={t.tone} onUndo={t.onUndo} T={T} onDismiss={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} />
          ))}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useProtoState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProtoState must be used within ProtoStateProvider");
  return ctx;
}
