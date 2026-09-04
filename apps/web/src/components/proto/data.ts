// Seed data ported exactly from stitchd-v9.jsx (WEDDING, SUPPLIERS_SEED,
// ROLE_ICON/ROLE_ORDER, BUDGET_SEED, TASKS_SEED, GUESTS_SEED, TABLES_SEED,
// HIRE/HIRE_CATS/OCCASIONS, LEADS_SEED, SUP_STATS, BOOST/VERIFY). This is the
// prototype's own flagship demo content (Junior & Nadine Chaka's wedding) —
// used as-is for lenses that don't have real backend data yet.
import {
  Crown, Building2, UtensilsCrossed, Camera, Music, Video, Cake as CakeIcon, Mic2,
  Wand2, Car, Tent, Scissors, Flower2, Sparkles, LayoutGrid, Heart,
  Flame, Coffee, Droplet, Lightbulb, Package,
} from "lucide-react";
import type { Theme } from "../../theme/theme";

export const SEV = { high: "#F0644C", medium: "#E9B84C", low: "#5FA8F5" };
export const STATUS_C = (T: Theme) => ({ confirmed: T.good, pending: T.faint, issue: T.bad });

export const WEDDING = {
  couple: "Junior & Nadine",
  dateLabel: "Sat 14 November 2026",
  dateISO: "2026-11-14",
  venue: "Oakfield Farm, Muldersdrift",
  coach: "Lungi Dlodlo",
  rsvpDeadline: "2026-09-15",
};
// The white wedding isn't the only gathering — most Gauteng weddings this
// app is modelled on pair it with a traditional lobola celebration. Kept as
// a distinct real constant (not a fabricated aside) so Passes/Our day can
// show real per-event guest counts instead of inventing a second data
// source.
export const SECOND_EVENT = {
  name: "Lobola",
  dateLabel: "Sat 21 November 2026",
  venue: "Family home, Soweto",
  guests: 60,
  note: "Families meet 19 July to finalise the day.",
};
const TODAY = new Date();
export const DAYS_LEFT = Math.max(0, Math.ceil((new Date("2026-11-14T00:00:00").getTime() - TODAY.getTime()) / 86400000));
export const RSVP_DAYS = Math.max(0, Math.ceil((new Date(WEDDING.rsvpDeadline).getTime() - TODAY.getTime()) / 86400000));

// Task due dates are offsets from "now" rather than fixed calendar dates —
// hardcoded ISO strings drift into the past as real time passes (every task
// eventually reads "overdue" and piles into Week.tsx's "This week" column,
// leaving "This month"/"Before the day" permanently empty), so the demo
// stays realistic regardless of when it's actually opened.
const isoDaysFromNow = (n: number) => new Date(TODAY.getTime() + n * 86400000).toISOString().slice(0, 10);

export const ROLE_ICON: Record<string, typeof Crown> = {
  Planner: Crown, Venue: Building2, Catering: UtensilsCrossed, Photography: Camera,
  Entertainment: Music, Videography: Video, Cake: CakeIcon, MC: Mic2,
  "Hair & Makeup": Wand2, Transport: Car, "Tent & Weather": Tent,
  Tailor: Scissors, "Flower Specialist": Flower2, "Décor Supplier": Sparkles,
};
export const ROLE_ORDER = ["Planner", "Venue", "Catering", "Photography", "Videography", "Entertainment", "MC", "Cake", "Hair & Makeup", "Transport", "Tent & Weather", "Tailor", "Flower Specialist", "Décor Supplier"];
export const roleRank = (r: string) => { const i = ROLE_ORDER.indexOf(r); return i < 0 ? 99 : i; };

export const POS: Record<string, string> = {
  Planner: "PLN", Venue: "VEN", Catering: "CAT", Photography: "PHO", Entertainment: "ENT",
  Videography: "VID", Cake: "CAK", MC: "MC", "Hair & Makeup": "GLM", Transport: "TRN",
  "Tent & Weather": "TNT", Tailor: "TLR", "Flower Specialist": "FLR", "Décor Supplier": "DEC",
};

export interface Supplier {
  id: string; role: string; name: string; sub: string; price: number; rating: number;
  reviews: number; resp: number; onTime: number; rebook: number;
  status: "confirmed" | "pending" | "issue"; zone: "core" | "bench";
  bundle?: [string, number][]; bundleList?: number; bundleSaving?: number;
  issueNote?: string; waitNote?: string; rec?: boolean; viaBundle?: boolean;
}
const S = (id: string, role: string, name: string, sub: string, price: number, rating: number, reviews: number, resp: number, onTime: number, rebook: number, status: Supplier["status"], zone: Supplier["zone"], extra: Partial<Supplier> = {}): Supplier =>
  ({ id, role, name, sub, price, rating, reviews, resp, onTime, rebook, status, zone, ...extra });

export const SUPPLIERS_SEED: Supplier[] = [
  S("p1", "Planner", "VIP Hosting", "Lungi Dlodlo · Lead Planner", 35, 4.9, 128, 2, 99, 95, "confirmed", "core"),
  S("p2", "Venue", "Oakfield Farm", "Premium venue · Muldersdrift", 128, 4.8, 96, 4, 97, 90, "confirmed", "core",
    { bundle: [["Venue hire", 85], ["Catering — plated 140", 65], ["Décor & lighting", 22], ["DJ & sound", 15], ["Furniture & linen", 12]], bundleList: 199, bundleSaving: 71 }),
  S("p3", "Photography", "Memories by TK", "Photo & video · Sandton", 28, 4.9, 201, 2, 99, 93, "confirmed", "core"),
  S("p4", "Catering", "Taste Affair", "Plated · 140 pax", 65, 4.7, 80, 5, 96, 87, "issue", "core",
    { issueNote: "Date clash on 14 Nov — awaiting reschedule confirmation" }),
  S("p6", "Entertainment", "Vibe Creators", "DJ & sound · Soweto", 15, 4.8, 156, 3, 97, 91, "confirmed", "core"),
  S("p3v", "Videography", "Reel Love Films", "Highlight film · Rosebank", 28, 4.6, 67, 7, 94, 81, "pending", "bench",
    { waitNote: "Quote came in at R28 000 for the full day. They can shoot Friday's setup too for R4 000 more if you want it." }),
  S("p8", "Cake", "Sugar & Spice", "3-tier + dessert table", 9.5, 4.9, 210, 5, 98, 92, "pending", "bench",
    { waitNote: "\"Three-tier with a dessert table for 140 comes to R9 500 — fondant or buttercream finish?\" Reply needed by Friday to lock the tasting slot." }),
  S("p9", "MC", "MC Bongani Live", "Master of ceremonies", 6, 4.8, 65, 6, 95, 84, "pending", "bench",
    { waitNote: "R6 000 for the full programme, running sheet included. He's asked for your final speech order by end of month." }),
  S("p10", "Hair & Makeup", "Glam Squad by Zanele", "Bride + 4 maids", 9, 4.7, 68, 4, 97, 88, "pending", "bench",
    { waitNote: "Bride + 4 maids quoted at R9 000. R1 500 more if you add a hair trial for your mom." }),
  S("p11", "Transport", "VIP Chauffeurs", "Couple car + guest shuttle", 12, 4.8, 40, 8, 93, 80, "pending", "bench",
    { waitNote: "Couple car + guest shuttle quoted at R12 000. They need your pickup addresses two weeks out to confirm routes." }),
  S("p13", "Tent & Weather", "Shade & Shine Marquees", "Weather backup · 160 pax", 18.5, 4.8, 54, 3, 98, 90, "pending", "bench",
    { rec: true, waitNote: "Weather backup for 160 guests — R18 500, refundable if you cancel by October. Recommended given your ceremony's outdoors." }),
  S("p14", "Tailor", "Stitch & Cut Atelier", "Groom + groomsmen suiting", 16, 4.8, 58, 5, 96, 86, "pending", "bench",
    { waitNote: "Groom + groomsmen suiting quoted at R16 000 for six. First fitting needs booking six weeks out." }),
  S("p5", "Flower Specialist", "Bloom Room", "Floral designer · Bryanston", 22, 4.9, 74, 4, 96, 89, "confirmed", "core"),
  S("p12", "Décor Supplier", "Décor Elegance", "Draping, tables, lighting", 12, 4.6, 47, 7, 92, 79, "pending", "bench",
    { waitNote: "Draping, tables and lighting quoted at R12 000 to your palette. They're holding the slot until florals are confirmed." }),
];
export const WA: Record<string, string> = { p1: "27821230001", p2: "27821230002", p3: "27821230003", p4: "27821230004", p5: "27821230005", p6: "27821230006", p3v: "27821230007", p8: "27821230008", p9: "27821230009", p10: "27821230010", p11: "27821230011", p12: "27821230012", p13: "27821230013", p14: "27821230014" };
export const perfScore = (s: Supplier) => Math.max(40, Math.min(99, Math.round(s.rating * 10 + s.onTime * 0.2 + s.rebook * 0.25 - s.resp * 1.1)));

// Suppliers > Find someone — real discovery, not a second "Your circle".
// Every role in ROLE_ORDER already has exactly one supplier in
// SUPPLIERS_SEED (readiness/budget/category-chip logic across the app
// assumes one-per-role), so a candidate here isn't an *extra* supplier —
// it's a real alternative to the role's current "pending" pick, and
// booking one really does swap it in via ProtoState (see Marketplace.tsx's
// bookCandidate). Confirmed roles aren't shown; there's nothing left to
// decide on those.
export interface Candidate {
  id: string; role: string; name: string; area: string; style: string;
  price: number; rating: number; reviews: number; respHours: number;
  badge: "Held" | "Best value" | null; heldUntil?: string; compareNote: string;
}
const C = (id: string, role: string, name: string, area: string, style: string, price: number, rating: number, reviews: number, respHours: number, badge: Candidate["badge"], compareNote: string, heldUntil?: string): Candidate =>
  ({ id, role, name, area, style, price, rating, reviews, respHours, badge, compareNote, heldUntil });

export const CANDIDATE_SEED: Candidate[] = [
  C("c3v", "Videography", "Frame & Story", "Melville", "documentary, natural light", 24, 4.7, 89, 3, "Best value",
    "R4 000 cheaper than Reel Love Films and a faster reply time — but Reel Love already has your venue walkthrough booked."),
  C("c8", "Cake", "Cocoa & Co", "Fourways", "modern, minimal tiers", 8, 4.8, 132, 4, "Held",
    "Holding 14 November for you at R1 500 under Sugar & Spice — same flavour tasting slot, one week sooner.", "Fri 17:00"),
  C("c9", "MC", "Thabo Live", "Braamfontein", "bilingual, high energy", 7, 4.9, 41, 2, null,
    "R1 000 more than MC Bongani but 4.9★ over 41 events and bilingual — worth it if either family needs Zulu on the mic."),
  C("c10", "Hair & Makeup", "Studio Nala", "Rosebank", "editorial, airbrush", 11, 4.9, 95, 3, null,
    "R2 000 more than Glam Squad, but airbrush is included instead of an add-on — nets out close to even."),
  C("c11", "Transport", "Sandton Fleet Cars", "Sandton", "classic cars, uniformed drivers", 10, 4.6, 52, 6, "Best value",
    "R2 000 cheaper than VIP Chauffeurs for the same couple-car + shuttle package — slower to reply though."),
  C("c13", "Tent & Weather", "Cover & Co Marquees", "Krugersdorp", "clear-span, 200 pax", 21, 4.9, 88, 2, "Held",
    "R2 500 more than Shade & Shine but rated higher and already holding your date — Shade & Shine hasn't confirmed availability yet.", "Sun 12:00"),
  C("c14", "Tailor", "Modern Fit Menswear", "Rivonia", "contemporary, quick turnaround", 14, 4.7, 63, 4, "Best value",
    "R2 000 cheaper than Stitch & Cut and can still fit six people in four weeks instead of six."),
  C("c12", "Décor Supplier", "Bloom & Drape Co", "Randburg", "florals + draping, one supplier", 13.5, 4.8, 59, 3, null,
    "R1 500 more than Décor Elegance, but bundles florals in with draping — one supplier instead of two to coordinate."),
];

export const BUDGET_SEED = [
  { id: "b1", cat: "Venue", label: "Oakfield Farm — venue + service", cost: 85, need: 10, paid: true },
  { id: "b2", cat: "Catering", label: "Taste Affair — plated, 140 pax", cost: 65, need: 10, paid: true },
  { id: "b3", cat: "Planner", label: "VIP Hosting — full planning", cost: 35, need: 9, paid: true },
  { id: "b4", cat: "Attire", label: "Gown + suits + party", cost: 42, need: 9, paid: false },
  { id: "b5", cat: "Photo", label: "Memories by TK — full day", cost: 28, need: 9, paid: true },
  { id: "b6", cat: "Florals", label: "Bloom Room — florals + draping", cost: 22, need: 7, paid: false },
  { id: "b7", cat: "Music", label: "Vibe Creators — DJ + sound", cost: 15, need: 8, paid: false },
  { id: "b8", cat: "Video", label: "Reel Love — highlight film", cost: 28, need: 6, paid: false },
  { id: "b9", cat: "Glam", label: "Glam Squad — bride + maids", cost: 9, need: 7, paid: false },
  { id: "b10", cat: "Cake", label: "Sugar & Spice — 3-tier", cost: 9.5, need: 6, paid: false },
  { id: "b11", cat: "Transport", label: "VIP Chauffeurs — shuttle", cost: 12, need: 5, paid: false },
  { id: "b12", cat: "Weather", label: "Shade & Shine — marquee hold", cost: 18.5, need: 5, paid: false },
  { id: "b13", cat: "Extras", label: "MC Bongani — ceremonies", cost: 6, need: 4, paid: false },
  { id: "b14", cat: "Extras", label: "Photo booth — 4 hours", cost: 8.5, need: 3, paid: false },
  { id: "b15", cat: "Extras", label: "Sparkler send-off", cost: 7, need: 2, paid: false },
];
export const fmtR = (k: number) => (k >= 100 ? `R${Math.round(k)}k` : k >= 1 ? `R${k.toFixed(1).replace(".0", "")}k` : `R${Math.round(k * 1000)}`);
export const BENCH: Record<string, [number, number]> = {
  Venue: [70, 95], Catering: [55, 80], Planner: [25, 40], Attire: [30, 55], Photo: [22, 35],
  Florals: [15, 28], Music: [10, 20], Video: [18, 35], Glam: [7, 14], Cake: [6, 12],
  Transport: [8, 16], Weather: [12, 22], Extras: [10, 25],
};
export const benchStatus = (spend: number, cat: string) => {
  const b = BENCH[cat]; if (!b) return { label: "Not enough information", c: "faint" as const };
  if (spend < b[0] * 0.8) return { label: "Below typical range", c: "info" as const };
  if (spend <= b[1]) return { label: "Within typical range", c: "good" as const };
  if (spend <= b[1] * 1.25) return { label: "Above typical range", c: "warn" as const };
  return { label: "Significantly above typical", c: "bad" as const };
};

export const TASKS_SEED = [
  { id: "t1", title: "Send remaining 32 invites", note: "The Zuma cousins and a few others still haven't had theirs.", owner: "Nadine", due: isoDaysFromNow(3), pr: "high", st: "todo" },
  { id: "t2", title: "Pay Bloom Room florals deposit (R6.6k)", note: "Lerato holds the in-season protea pricing until this lands.", owner: "Junior", due: isoDaysFromNow(4), pr: "high", st: "todo" },
  { id: "t3", title: "Shot list with Memories by TK", note: "Getting-ready, family formals, and the two of you at golden hour.", owner: "Nadine", due: isoDaysFromNow(6), pr: "medium", st: "doing" },
  { id: "t4", title: "Secure shuttle before Aug price rise", note: "Gauteng Shuttle Co. — two runs from Sandton, one from OR Tambo.", owner: "Junior", due: isoDaysFromNow(18), pr: "high", st: "waiting" },
  { id: "t5", title: "Marriage officer paperwork", note: "Rev. Dlamini's reference is on file — just needs signing.", owner: "Lungi", due: isoDaysFromNow(45), pr: "high", st: "doing" },
  { id: "t6", title: "Menu tasting at Oakfield", note: "Confirmed with Avianto — five courses, two cake options.", owner: "Both", due: isoDaysFromNow(-10), pr: "high", st: "done" },
  { id: "t7", title: "DJ playlist + do-not-play brief", note: "Vibe Creators has the final list.", owner: "Junior", due: isoDaysFromNow(-15), pr: "low", st: "done" },
];
export const T_COLS: [string, string][] = [["todo", "To do"], ["doing", "Doing"], ["waiting", "Waiting"], ["done", "Done"]];

export const REL_GROUPS = [
  "Bride's immediate family", "Groom's immediate family", "Bride's extended family", "Groom's extended family",
  "Wedding party", "Mutual friends", "Bride's friends", "Groom's friends", "Colleagues", "Family friends", "Children", "Other",
];
export const DIET_OPTIONS = ["Halal", "Vegetarian", "Vegan", "Gluten-free", "Nut allergy", "Kosher", "Other"];
export const REL_SHORT: Record<string, string> = {
  "Bride's immediate family": "Bride · immediate", "Groom's immediate family": "Groom · immediate",
  "Bride's extended family": "Bride · extended", "Groom's extended family": "Groom · extended",
  "Wedding party": "Wedding party", "Mutual friends": "Mutual friends", "Bride's friends": "Bride · friends",
  "Groom's friends": "Groom · friends", Colleagues: "Colleagues", "Family friends": "Family friends", Children: "Children", Other: "Other",
};
const G = (id: string, name: string, rel: string, house: string, rsvp: "yes" | "no" | "pending", party: number, ph: string, em: string, table: string | null, needs: [string, number][] = [], child = false) =>
  ({ id, name, rel, house, rsvp, party, ph, em, table, needs, child, rem: 0, remAt: null as string | null });
export const GUESTS_SEED = [
  G("g1", "Grace Mokoena", "Groom's immediate family", "Mokoena parents", "yes", 1, "27821110001", "grace.m@example.co.za", "T1"),
  G("g2", "Solomon Mokoena", "Groom's immediate family", "Mokoena parents", "yes", 1, "27821110002", "solomon.m@example.co.za", "T1", [["Diabetic-friendly", 1]]),
  G("g3", "Thandi Ndlovu", "Bride's immediate family", "Ndlovu elders", "yes", 1, "27821110003", "t.ndlovu@example.co.za", "T2", [["Soft foods", 1]]),
  G("g4a", "Sipho Mokoena", "Groom's extended family", "Sipho & Lerato", "yes", 1, "27821110004", "sipho.m@example.co.za", "T3"),
  G("g4b", "Lerato Mokoena", "Groom's extended family", "Sipho & Lerato", "yes", 1, "27821110014", "lerato.m@example.co.za", "T3"),
  G("g5", "Zanele Ndlovu", "Bride's immediate family", "Ndlovu elders", "pending", 1, "27821110005", "zanele.n@example.co.za", "T2"),
  G("g6", "Kagiso Molefe", "Groom's friends", "Molefe", "pending", 2, "27821110006", "kagiso.molefe@example.co.za", null),
  G("g7a", "Amahle Zulu", "Mutual friends", "Zulu", "yes", 1, "27821110007", "amahle.z@example.co.za", "T4", [["Halal", 1]]),
  G("g7b", "Bongani Zulu", "Mutual friends", "Zulu", "yes", 1, "27821110017", "bongani.z@example.co.za", "T4", [["Halal", 1]]),
  G("g8", "Refilwe Khumalo", "Bride's friends", "Khumalo", "no", 1, "27821110008", "refilwe.k@example.co.za", null),
  G("g9", "Tshepo Radebe", "Colleagues", "Radebe", "pending", 2, "27821110009", "tshepo.r@example.co.za", null),
  G("g10a", "Naledi Dube", "Wedding party", "Dube", "yes", 1, "27821110010", "naledi.d@example.co.za", "T4", [["Vegetarian", 1]]),
  G("g10b", "Thabo Dube", "Wedding party", "Dube", "yes", 1, "27821110020", "thabo.d@example.co.za", "T4"),
  G("g11", "Palesa Ndlovu", "Bride's extended family", "Ndlovu cousins", "pending", 1, "27821110011", "palesa.n@example.co.za", null),
  G("g12", "Vusi Mokoena", "Groom's extended family", "Mokoena uncles", "pending", 1, "27821110012", "vusi.mokoena@example.co.za", null),
  G("g13", "Baby Lisakhanya", "Children", "Sipho & Lerato", "yes", 1, "27821110004", "sipho.m@example.co.za", null, [], true),
  G("g14a", "Nomvula Mahlangu", "Bride's extended family", "Mahlangu", "yes", 1, "27821110021", "nomvula.m@example.co.za", "T5"),
  G("g14b", "Sibusiso Mahlangu", "Bride's extended family", "Mahlangu", "yes", 1, "27821110022", "sibusiso.m@example.co.za", "T5"),
  G("g15", "Andile Khumalo", "Colleagues", "Khumalo", "yes", 1, "27821110023", "andile.k@example.co.za", "T5"),
  G("g16", "Boitumelo Sithole", "Mutual friends", "Sithole", "pending", 1, "27821110024", "boitumelo.s@example.co.za", null),
  G("g17", "Karabo Ngwenya", "Groom's friends", "Ngwenya", "yes", 2, "27821110025", "karabo.n@example.co.za", "T6"),
  G("g18", "Lindiwe Cele", "Bride's friends", "Cele", "yes", 1, "27821110026", "lindiwe.c@example.co.za", "T6", [["Vegetarian", 1]]),
  G("g19", "Mpho Radebe", "Colleagues", "Radebe", "pending", 1, "27821110027", "mpho.r@example.co.za", null),
];
// Real reply text for the Invitations feed ("What people are saying") —
// keyed by GUESTS_SEED id rather than a new field on G() so the helper's
// signature (and every existing call site) stays untouched. Only guests
// whose rsvp isn't "pending" get a quote here — a household that hasn't
// replied yet has nothing to quote.
export const GUEST_QUOTES: Record<string, string> = {
  g1: "All two of us, and we'll bring a diabetic-friendly plate reminder just in case.",
  g3: "Wouldn't miss it. Could we get a chair near the front for Thandi?",
  g7a: "Coming with Bongani — please make sure the caterer has the Halal order.",
  g8: "So sorry, we'll be in Cape Town that weekend — gift is on its way.",
  g10a: "We're there! Vegetarian plate confirmed for me, standard for Thabo.",
  g14a: "Both of us are in, Sibusiso's bringing his mother's koeksisters for the family table.",
};
export const RSVP_BASE = { seats: 96, halal: 6, veg: 4 };
export const SEAT_CAP = 10;
// Per-head suppliers that must approve a material headcount change (rand/guest).
export const PER_HEAD: Record<string, number> = { Catering: 650, Cake: 90, Bar: 120 };
export const TABLES_SEED = [
  { id: "T1", name: "Table 1 — Mokoena family", cap: 10, locked: false },
  { id: "T2", name: "Table 2 — Ndlovu family", cap: 10, locked: false },
  { id: "T3", name: "Table 3 — Extended family", cap: 10, locked: false },
  { id: "T4", name: "Table 4 — Wedding party", cap: 10, locked: false },
  { id: "T5", name: "Table 5 — Mahlangu family", cap: 10, locked: false },
  { id: "T6", name: "Table 6 — Friends", cap: 10, locked: false },
];

export const randR = (n: number) => `R${Math.round(n).toLocaleString("en-ZA")}`;
export const HIRE_CATS = [
  { k: "marquee", label: "Marquees & Tents", I: Tent, role: "Tent & Weather", tag: "Rain plan sorted" },
  { k: "seating", label: "Chairs & Tables", I: LayoutGrid, role: "Décor Supplier", tag: "Seats everyone" },
  { k: "sound", label: "Sound & DJ", I: Music, role: "Entertainment", tag: "Fills the floor" },
  { k: "catering", label: "Food & Braai", I: Flame, role: "Catering", tag: "No one goes hungry" },
  { k: "castle", label: "Jumping Castles", I: Sparkles, role: "Entertainment", tag: "Kids sorted" },
  { k: "bar", label: "Mobile Bar", I: Coffee, role: "Catering", tag: "Drinks flowing" },
  { k: "loos", label: "VIP Loos", I: Droplet, role: "Tent & Weather", tag: "Dignified" },
  { k: "decor", label: "Décor & Draping", I: Sparkles, role: "Décor Supplier", tag: "Instant wow" },
  { k: "power", label: "Power & Generators", I: Lightbulb, role: "Tent & Weather", tag: "Never goes dark" },
  { k: "cold", label: "Cold Rooms", I: Package, role: "Catering", tag: "Keeps it fresh" },
  { k: "booth", label: "Photo Booth", I: Camera, role: "Photography", tag: "Memories on tap" },
  { k: "coffee", label: "Coffee Cart", I: Coffee, role: "Catering", tag: "Morning saviour" },
];
const H = (id: string, cat: string, name: string, area: string, price: number, unit: string, rating: number, reviews: number, avail: string, blurb: string, addons: [string, number][] = []) =>
  ({ id, cat, name, area, price, unit, rating, reviews, avail, blurb, addons });
export const HIRE = [
  H("h1", "marquee", "Stretch & Shade", "Fourways", 3500, "day", 4.7, 212, "This weekend", "10×15m stretch tent, sides & pegs included. Sleeps a 120-guest floor.", [["Marquee flooring", 1400], ["Festoon lighting", 850]]),
  H("h2", "marquee", "Peg & Pole Co.", "Roodepoort", 2650, "day", 4.5, 98, "This weekend", "Classic frame marquee, 6×12m. Great budget rain-cover.", [["Side walls", 600]]),
  H("h3", "seating", "Seat Yourself", "Midrand", 28, "chair/day", 4.6, 340, "This weekend", "Tiffany chairs with cushions. Min 20. Tables extra.", [["Round tables (10-seat)", 180], ["Table linen", 45]]),
  H("h4", "seating", "The Table Company", "Benoni", 190, "table/day", 4.4, 76, "Mon onwards", "Wooden trestle & round tables, all sizes.", [["Bench seating", 120]]),
  H("h5", "sound", "BassLine JHB", "Soweto", 2800, "night", 4.8, 265, "This weekend", "DJ + rig for up to 200. Includes setup & an MC mic.", [["Dance-floor lights", 700], ["Extra sub", 500]]),
  H("h6", "catering", "Braai Brothers", "Randburg", 185, "head", 4.7, 189, "48h notice", "Spit braai — lamb, beef, boerewors, 3 sides, rolls.", [["Vegetarian platter", 900], ["Servers (x2)", 800]]),
  H("h7", "castle", "Bounce Town", "Boksburg", 950, "day", 4.6, 154, "This weekend", "Big castle + soft-play. Delivery & supervision optional.", [["Supervisor", 550], ["Popcorn machine", 400]]),
  H("h8", "bar", "Tap & Pour", "Sandton", 4200, "event", 4.8, 121, "This weekend", "Mobile bar + bartender, 4 hrs. Glassware included.", [["2nd bartender", 900], ["Cocktail package", 1600]]),
  H("h9", "loos", "Loo Deluxe", "Kempton Park", 2500, "weekend", 4.5, 64, "This weekend", "2× VIP loo trailer, serviced, lit, hand basins.", [["Attendant", 700]]),
  H("h10", "decor", "Drape Envy", "Bryanston", 6500, "event", 4.9, 88, "1 week notice", "Full draping, backdrop & centrepieces to your palette.", [["Flower wall", 2200], ["Aisle styling", 1500]]),
  H("h11", "power", "PowerUp Rentals", "Germiston", 1800, "day", 4.6, 143, "This weekend", "25kVA silent generator, fuel for 8 hrs, cabling.", [["Extra fuel (8h)", 650]]),
  H("h12", "cold", "Chill Trailer Co.", "Edenvale", 1500, "day", 4.7, 71, "This weekend", "Walk-in cold-room trailer. Keeps catering & drinks cold.", [["Bar fridge (x2)", 400]]),
  H("h13", "booth", "Snap Shack", "Rosebank", 3200, "event", 4.8, 176, "This weekend", "Photo booth, props, unlimited prints, 3 hrs + attendant.", [["Guest album", 600], ["Extra hour", 800]]),
  H("h14", "coffee", "Bean Machine", "Parktown", 2900, "event", 4.9, 203, "48h notice", "Barista coffee cart, 3 hrs, unlimited cups.", [["Extra hour", 700], ["Hot chocolate add-on", 400]]),
];
export const OCCASIONS = [
  { k: "birthday", label: "Birthday", I: Sparkles, items: ["h7", "h3", "h14"], save: 620, line: "Castle, seating & a coffee cart — sorted before the cake." },
  { k: "funeral", label: "Funeral", I: Heart, items: ["h2", "h3", "h6"], save: 540, line: "Dignified cover, seating and catering, handled with care." },
  { k: "wedding", label: "Wedding", I: Sparkles, items: ["h1", "h10", "h5", "h8"], save: 1850, line: "Tent, décor, sound and a bar — the celebration core." },
  { k: "corporate", label: "Corporate", I: Building2, items: ["h5", "h4", "h14", "h11"], save: 980, line: "Sound, seating, coffee and back-up power for the day." },
  { k: "braai", label: "Backyard Braai", I: Flame, items: ["h6", "h8", "h5"], save: 760, line: "Braai, bar and beats. Say no more." },
];
export const SUB = { name: "Stitched+", price: 99, pct: 0.12, delivery: 450 };

const L = (id: string, sup: string, client: string, occasion: string, when: string, value: number, member: boolean, status: string) => ({ id, sup, client, occasion, when, value, member, status });
export const LEADS_SEED = [
  L("l1", "h5", "Kagiso M.", "Birthday", "Sat 2 Aug", 3500, true, "new"),
  L("l2", "h5", "Naledi D.", "Corporate", "Fri 8 Aug", 3300, false, "new"),
  L("l3", "h5", "Thabo R.", "Wedding", "Sat 16 Aug", 3800, true, "new"),
  L("l4", "h1", "Junior & Nadine", "Wedding", "Sat 14 Nov", 3500, true, "accepted"),
  L("l5", "h8", "Zanele N.", "Party", "Sun 3 Aug", 4200, false, "new"),
  L("l6", "h14", "Palesa N.", "Corporate", "Wed 6 Aug", 2900, true, "new"),
];
export const SUP_STATS: Record<string, { gmv: number; orders: number; rating: number; repeat: number; memberShare: number; payout: number; nextPayout: string; views: number; convFree: number; convBoost: number }> = {
  h5: { gmv: 42, orders: 12, rating: 4.8, repeat: 38, memberShare: 61, payout: 37, nextPayout: "Fri 8 Aug", views: 214, convFree: 6, convBoost: 14 },
};
export const BOOST = { price: 350, upliftPct: 130 };
export const VERIFY = { price: 0, convLift: 42 };

// Lungi's other clients — ported exactly from stitchd-v9.jsx lines 382-387.
// w2 (Junior & Nadine) is the live event this whole app is built around, so
// its readiness reads the real board instead of this seeded "ready" figure.
export const BOOK = [
  { id: "w1", c: "Thabo & Keabetswe", d: "29 Aug 2026", days: 38, risk: "high" as const, ready: 71, guests: 210, fee: 42, open: 4, venue: "Shepstone Gardens, Mouille Point", wa: "27825550101", note: "Caterer pulled out at 5 weeks. Two replacements quoted, neither confirmed." },
  { id: "w2", c: "Junior & Nadine", d: "14 Nov 2026", days: DAYS_LEFT, risk: "medium" as const, ready: 0, guests: 140, fee: 35, open: 2, venue: "Oakfield Farm, Muldersdrift", wa: "27825550102", note: "Taste Affair date clash open; RSVPs behind schedule." },
  { id: "w3", c: "Sipho & Amahle", d: "20 Feb 2027", days: 213, risk: "low" as const, ready: 64, guests: 90, fee: 28, open: 1, venue: "Nooitgedacht, Stellenbosch", wa: "27825550103", note: "On track. Venue walkthrough Friday, nothing blocking." },
  { id: "w4", c: "Priya & Daniel", d: "22 May 2027", days: 304, risk: "low" as const, guests: 320, fee: 55, open: 3, ready: 41, venue: "Val de Vie, Paarl", wa: "27825550104", note: "Early stage. Budget workshop booked; guest list still moving." },
];

// "Us" group seed content (Our day / Vision / Gifts / The day / Documents) —
// net-new demo domains with no existing analogue in ProtoState, per the
// phased redesign plan. Coach reuses the real readiness score instead (see
// useReadiness's R.parts) rather than a separate fabricated breakdown.
export const STORY_SEED = [
  { year: "2021", title: "Met through mutual friends", note: "A birthday braai in Melville", shotSeed: "story-braai" },
  { year: "2023", title: "First trip together", note: "Four days in the Drakensberg, one flat tyre", shotSeed: "story-trip1" },
  { year: "2025", title: "He asked", note: "Sunset at Zoo Lake, ring in his jacket pocket", shotSeed: "story-asked2" },
  { year: "Mar 2026", title: "Lobola concluded", note: "Both families, one long Saturday", shotSeed: "story-lobola1" },
  { year: "14 Nov", title: "White wedding", note: `${WEDDING.venue} · 140 guests`, cat: "Venue" },
  { year: "21 Nov", title: `${SECOND_EVENT.name} celebration`, note: `${SECOND_EVENT.venue} · ${SECOND_EVENT.guests} guests`, shotSeed: "story-umabo" },
];

// `seed`/`female` are explicit (not left to Face's name-hash fallback) —
// three of these six names hashed to the identical EF_F[6] photo, the same
// class of duplicate-image bug fixed elsewhere this session (STORY_SEED,
// CANDIDATE_SEED). Seeds picked to land on distinct, non-zero pool indices
// (index 0 is reserved for the bride/groom themselves).
export const PARTY_SEED = [
  { id: "pty1", name: "Katlego Mahlangu", role: "Maid of honour", job: "Speech + getting-ready logistics", state: "Fitting booked", tone: "gold" as const, seed: "party-pty1", female: true },
  { id: "pty2", name: "Boitumelo Sithole", role: "Best man", job: "Rings, speech, shuttle marshalling", state: "Suit fitted — Stitch & Cut", tone: "good" as const, seed: "party-pty2", female: false },
  { id: "pty3", name: "Karabo Ntuli", role: "Bridesmaid", job: "Bouquet and veil", state: "Hair trial 18 Jul — Glam Squad", tone: "gold" as const, seed: "party-pty3", female: true },
  { id: "pty4", name: "Nomvula Radebe", role: "Bridesmaid", job: "Guest book and gifts table", state: "Hair trial 18 Jul — Glam Squad", tone: "gold" as const, seed: "party-pty4", female: true },
  { id: "pty5", name: "Mpho Dlamini", role: "Groomsman", job: "Ushering, 14:00 seating", state: "Suit fitted — Stitch & Cut", tone: "good" as const, seed: "party-pty5", female: false },
  { id: "pty6", name: "Lindiwe Chaka", role: "Flower girl", job: "Petals, then the kids' table", state: "Dress ordered", tone: "info" as const, seed: "party-pty6", female: true },
];

export const PAPERWORK_SEED = [
  { title: "Lobola concluded", note: "Both families signed off, March 2026", done: true },
  { title: "Home Affairs appointment", note: "Roodepoort branch booked for 15 Aug", done: true },
  { title: "Marriage officer confirmed", note: "On file with Lungi — see task list", done: false },
  { title: "ID copies for both of you", note: "Certified, uploaded to Documents", done: true },
  { title: "Antenuptial contract", note: "Signed with the attorney by 15 August", done: false },
];

export const DECISIONS_SEED = [
  { q: "Dress code", a: "Smart formal, gold accents", who: "Told to guests on the invite" },
  { q: "First dance", a: "Live intro, then Vibe Creators mixes in", who: "Vibe Creators has the track" },
  { q: "Cake", a: "3-tier vanilla + dessert table", who: "Sugar & Spice confirmed" },
  { q: "MC", a: "MC Bongani keeps the day on time", who: "Run sheet shared" },
];

export const MOODBOARD_SEED = [
  { id: "vis1", label: "Table setting" },
  { id: "vis2", label: "Bouquet & florals" },
  { id: "vis3", label: "Bridal attire" },
  { id: "vis4", label: "Lighting after dark" },
  { id: "vis5", label: "Cake" },
  { id: "vis6", label: "Décor & draping" },
];

export const REGISTRY_SEED = [
  { id: "reg1", item: "Honeymoon fund", target: 28000, got: 16400, color: "#6C4BE0", note: "Zanzibar, 22–29 November. 23 guests have contributed." },
  { id: "reg2", item: "Kitchen & home essentials", target: 12000, got: 9200, color: "#2E7D5B", note: "Most-chosen gift so far." },
  { id: "reg3", item: "Home deposit fund", target: 30000, got: 21500, color: "#2A7B8C", note: "14 households have contributed." },
];

export const RUNSHEET_SEED = [
  { time: "07:00", what: "Hair and make-up begins", detail: "Bridal suite · Glam Squad, bride + 4 maids", owner: "Glam Squad by Zanele" },
  { time: "10:00", what: "Suppliers arrive and set up", detail: "Florals, sound, marquee, cake table", owner: "Bloom Room" },
  { time: "12:30", what: "Photographer arrives", detail: "Getting-ready coverage, then details and dress", owner: "Memories by TK" },
  { time: "13:40", what: "Guest shuttle lands", detail: "First run from Sandton", owner: "VIP Chauffeurs" },
  { time: "14:00", what: "Guests seated", detail: "140 seats, doors open 13:45", owner: "Oakfield Farm" },
  { time: "14:30", what: "You get married", detail: "45 minutes · garden lawn", owner: "MC Bongani Live" },
  { time: "15:30", what: "Drinks and canapés", detail: "Terrace — Vibe Creators opening set", owner: "Vibe Creators" },
  { time: "18:00", what: "Dinner served", detail: "140 plated", owner: "Taste Affair" },
  { time: "20:00", what: "Speeches", detail: "MC keeps time, four speeches", owner: "MC Bongani Live" },
  { time: "21:00", what: "First dance, floor opens", detail: "Set runs to midnight", owner: "Vibe Creators" },
  { time: "00:00", what: "Load-out and last shuttle", detail: "Venue clear by 01:00 per site rules", owner: "VIP Chauffeurs" },
];

export const DOCS_SEED = [
  { kind: "PDF" as const, name: "Oakfield Farm — venue contract", supplier: "Oakfield Farm", added: "12 Mar", size: "1.8 MB", state: "Signed" as const },
  { kind: "PDF" as const, name: "Taste Affair — catering quote v3", supplier: "Taste Affair", added: "18 Jun", size: "820 KB", state: "Needs you" as const },
  { kind: "PDF" as const, name: "Memories by TK — agreement", supplier: "Memories by TK", added: "02 Apr", size: "640 KB", state: "Signed" as const },
  { kind: "PDF" as const, name: "Vibe Creators — booking form", supplier: "Vibe Creators", added: "14 Apr", size: "310 KB", state: "Signed" as const },
  { kind: "PDF" as const, name: "Bloom Room — revised proposal", supplier: "Bloom Room", added: "20 Jun", size: "2.4 MB", state: "Needs you" as const },
  { kind: "DOC" as const, name: "Ceremony programme draft", supplier: "MC Bongani Live", added: "09 Jun", size: "48 KB", state: "In review" as const },
  { kind: "XLS" as const, name: "Guest list master", supplier: "Yours", added: "22 Jun", size: "96 KB", state: "Live" as const },
  { kind: "PDF" as const, name: "VIP Hosting — planning agreement", supplier: "VIP Hosting", added: "04 Feb", size: "410 KB", state: "Signed" as const },
  { kind: "JPG" as const, name: "Marriage licence scan", supplier: "Home Affairs", added: "28 May", size: "1.1 MB", state: "Filed" as const },
];

export const VISION_BRIEF = {
  words: ["Warm", "Golden-hour", "Unhurried"],
  note: "Candlelight over overhead lighting, in-season blooms over hothouse roses, and a floor that fills itself once the plates are cleared.",
};

export const LESSONS_SEED = [
  {
    title: "How to ask a caterer for a better number",
    mins: "4 min read",
    note: "The three lines that work, and the one that offends.",
    body: [
      "Caterers quote to the brief they're given, not to your budget — so the fastest way down in price is a smaller, more specific brief, not a haggle.",
      "Line one: ask for a buffet-vs-plated comparison on the same menu, even if you've already decided. It shows you understand the cost driver (service staff, not food), and it usually surfaces a number you didn't know was on the table.",
      "Line two: ask which of your add-ons they'd drop first if the budget got tight. Caterers know their own margins better than you do — let them tell you where the fat is instead of guessing.",
      "Line three: ask for their off-peak pricing, even for a Saturday. Many Gauteng caterers quietly discount for a 2pm start over a 6pm one, because it changes their staffing shift.",
      "The line that offends: \"can you just do it cheaper\" with no brief change. It reads as not respecting their costing, and it's the fastest way to get a defensive, padded second quote instead of a better one.",
    ],
  },
  {
    title: "Lobola and a white wedding, weeks apart",
    mins: "6 min read",
    note: "Who hosts what, who pays what, and how to keep both families calm.",
    body: [
      "The two events have different hosts by tradition, and mixing that up early is where most of the tension starts — lobola negotiations are the groom's family's event to run, the white wedding is usually planned jointly.",
      "Money gets confusing fast if it isn't named early. A short, calm conversation with both sets of parents — before venues are booked, not after — about who's covering what removes most of the guesswork that otherwise turns into resentment two months in.",
      "Guest list overlap is the second flashpoint: elders who attend lobola often expect a seat at the white wedding too, and vice versa. Build one shared household list early so nobody's counted twice or left off by accident.",
      "Timing between the two matters more than people admit — a gap of at least two or three weeks gives both families room to actually enjoy each event instead of running on fumes for both in one weekend.",
      "When it gets tense, the honest move is naming it directly to both families rather than letting the couple absorb it quietly — \"we want both sides to feel equally hosted\" is a sentence that defuses more than it seems like it should.",
    ],
  },
  {
    title: "Load-shedding is a wedding problem",
    mins: "3 min read",
    note: "What venues actually cover, and what you must hire yourself.",
    body: [
      "Most Gauteng venues will tell you they have backup power — ask exactly what that backup covers, because it's very often just the reception hall and kitchen, not the marquee, the dance floor lighting, or the outdoor ceremony sound.",
      "Get the venue's actual load-shedding schedule area (not just \"we have a generator\") and cross-check it against Eskom's stage 4+ schedule for your date. A Saturday evening slot can land right in a scheduled outage window with zero warning if the stage changes that week.",
      "The cheap insurance is a second, smaller generator hired just for the marquee lighting and DJ rig — most rental companies will do a half-day booking for this specifically, and it's a fraction of the cost of the main event generator.",
      "Tell your photographer and videographer in advance too — a sudden dark venue mid-reception is exactly the kind of moment they can plan around with backup lighting if they know it's a real possibility, not a surprise.",
    ],
  },
];

// Icons re-exported for the shell/nav (Store, LayoutGrid, ShoppingBag, Banknote,
// Users, Utensils, ClipboardCheck, CalendarRange, MessageCircle, Crown).
export { Store, LayoutGrid, ShoppingBag, Banknote, Users, Utensils, ClipboardCheck, CalendarRange, MessageCircle, Crown, Heart, Palette as PaletteIcon, Sun, Moon } from "lucide-react";
