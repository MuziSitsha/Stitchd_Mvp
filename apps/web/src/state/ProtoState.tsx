import { createContext, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { PALETTES } from "../theme/palettes";
import { rolesFor } from "../components/proto/readiness";
import { SUPPLIERS_SEED, GUESTS_SEED, TABLES_SEED, TASKS_SEED, WEDDING, PER_HEAD, fmtR, randR, type Supplier } from "../components/proto/data";
import { supabase } from "../lib/supabase";

export type Guest = (typeof GUESTS_SEED)[number];
export type Table = (typeof TABLES_SEED)[number];
export type Task = (typeof TASKS_SEED)[number];
export type RsvpVal = "yes" | "no" | "pending";
export type ChangeReq = { id: string; sup: string; role: string; delta: number; headcount: number; perHead: number; amount: number; status: "pending" | "approved" | "declined" };
export type Msg = { who: string; t: string; m: string; act?: { l: string; go: () => void } };
export type Profile = { etype: string; prior: Set<string>; supp: string; comm: "WhatsApp" | "Email" | "Call"; budget: number };
export type OnboardingResult = { etype: string; prior: string[]; supp: string; comm: "WhatsApp" | "Email" | "Call"; budget: number; pal: number; guests: number };
export type Basket = Record<string, { qty: number; addons: string[] }>;
type Toast = { id: string; m: string; tone: string };

const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const DEFAULT_PROFILE: Profile = { etype: "Wedding", prior: new Set(["Food & Catering", "Music & Entertainment", "Décor & Flowers"]), supp: "Full planning support", comm: "WhatsApp", budget: 400 };

interface ProtoStateValue {
  sup: Supplier[]; setSup: React.Dispatch<React.SetStateAction<Supplier[]>>;
  gList: Guest[]; setGList: React.Dispatch<React.SetStateAction<Guest[]>>;
  tables: Table[]; setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  budgetCap: number; setBudgetCap: (n: number) => void;
  pinned: Set<string>; setPinned: React.Dispatch<React.SetStateAction<Set<string>>>;
  bundleApplied: boolean;
  msgs: Msg[]; setMsgs: React.Dispatch<React.SetStateAction<Msg[]>>;
  chased: boolean;
  toasts: Toast[];
  toast: (m: string, tone?: string) => void;
  secure: (id: string) => void;
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
  const [tasks, setTasks] = useState<Task[]>(TASKS_SEED);
  const [budgetCap, setBudgetCap] = useState(400);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [bundleApplied, setBundleApplied] = useState(false);
  const [chased, setChased] = useState(false);
  const [changeReqs, setChangeReqs] = useState<ChangeReq[]>([]);
  const [headcountBase, setHeadcountBase] = useState(140);
  const [guests, setGuests] = useState(140);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [showOnb, setShowOnb] = useState(initialShowOnb);
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

  function toast(m: string, tone = "good") {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, m, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3600);
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
          budget_cap_cents: Math.round(p.budget * 100),
          palette_index: p.pal,
          priorities: p.prior,
          support_level: p.supp,
          comm_channel: p.comm,
        })
        .then(({ error }) => {
          if (error) console.error("finishOnboarding: events insert failed", error);
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
    sup, setSup, gList, setGList, tables, setTables, tasks, setTasks,
    budgetCap, setBudgetCap, pinned, setPinned, bundleApplied,
    msgs, setMsgs, chased, toasts, toast,
    secure, moveZone, applyBundle, setRsvp, toggleGuestNeed, markReminded, chaseRsvp, channelLink,
    changeReqs, headcountBase, raiseChangeReqs, resolveChange,
    guests, setGuests, profile, showOnb, setShowOnb, finishOnboarding,
    basket, setBasket,
    selSup, setSelSup, readyOpen, setReadyOpen, coachSel, setCoachSel,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
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
    </Ctx.Provider>
  );
}

export function useProtoState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProtoState must be used within ProtoStateProvider");
  return ctx;
}
