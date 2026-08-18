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
  venue: "Oakfield Farm, Muldersdrift",
  coach: "Lungi Dlodlo",
  rsvpDeadline: "2026-09-15",
};
const TODAY = new Date();
export const DAYS_LEFT = Math.max(0, Math.ceil((new Date("2026-11-14T00:00:00").getTime() - TODAY.getTime()) / 86400000));
export const RSVP_DAYS = Math.max(0, Math.ceil((new Date(WEDDING.rsvpDeadline).getTime() - TODAY.getTime()) / 86400000));

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
  issueNote?: string; rec?: boolean; viaBundle?: boolean;
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
  S("p3v", "Videography", "Reel Love Films", "Highlight film · Rosebank", 28, 4.6, 67, 7, 94, 81, "pending", "bench"),
  S("p8", "Cake", "Sugar & Spice", "3-tier + dessert table", 9.5, 4.9, 210, 5, 98, 92, "pending", "bench"),
  S("p9", "MC", "MC Bongani Live", "Master of ceremonies", 6, 4.8, 65, 6, 95, 84, "pending", "bench"),
  S("p10", "Hair & Makeup", "Glam Squad by Zanele", "Bride + 4 maids", 9, 4.7, 68, 4, 97, 88, "pending", "bench"),
  S("p11", "Transport", "VIP Chauffeurs", "Couple car + guest shuttle", 12, 4.8, 40, 8, 93, 80, "pending", "bench"),
  S("p13", "Tent & Weather", "Shade & Shine Marquees", "Weather backup · 160 pax", 18.5, 4.8, 54, 3, 98, 90, "pending", "bench", { rec: true }),
  S("p14", "Tailor", "Stitch & Cut Atelier", "Groom + groomsmen suiting", 16, 4.8, 58, 5, 96, 86, "pending", "bench"),
  S("p5", "Flower Specialist", "Bloom Room", "Floral designer · Bryanston", 22, 4.9, 74, 4, 96, 89, "confirmed", "core"),
  S("p12", "Décor Supplier", "Décor Elegance", "Draping, tables, lighting", 12, 4.6, 47, 7, 92, 79, "pending", "bench"),
];
export const WA: Record<string, string> = { p1: "27821230001", p2: "27821230002", p3: "27821230003", p4: "27821230004", p5: "27821230005", p6: "27821230006", p3v: "27821230007", p8: "27821230008", p9: "27821230009", p10: "27821230010", p11: "27821230011", p12: "27821230012", p13: "27821230013", p14: "27821230014" };
export const perfScore = (s: Supplier) => Math.max(40, Math.min(99, Math.round(s.rating * 10 + s.onTime * 0.2 + s.rebook * 0.25 - s.resp * 1.1)));

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
  { id: "t1", title: "Send remaining 32 invites", owner: "Nadine", due: "2026-07-24", pr: "high", st: "todo" },
  { id: "t2", title: "Pay Bloom Room florals deposit (R6.6k)", owner: "Junior", due: "2026-07-25", pr: "high", st: "todo" },
  { id: "t3", title: "Shot list with Memories by TK", owner: "Nadine", due: "2026-07-28", pr: "medium", st: "doing" },
  { id: "t4", title: "Secure shuttle before Aug price rise", owner: "Junior", due: "2026-08-01", pr: "high", st: "waiting" },
  { id: "t5", title: "Marriage officer paperwork", owner: "Lungi", due: "2026-08-15", pr: "high", st: "doing" },
  { id: "t6", title: "Menu tasting at Oakfield", owner: "Both", due: "2026-07-10", pr: "high", st: "done" },
  { id: "t7", title: "DJ playlist + do-not-play brief", owner: "Junior", due: "2026-07-15", pr: "low", st: "done" },
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
];
export const RSVP_BASE = { seats: 96, halal: 6, veg: 4 };
export const SEAT_CAP = 10;
// Per-head suppliers that must approve a material headcount change (rand/guest).
export const PER_HEAD: Record<string, number> = { Catering: 650, Cake: 90, Bar: 120 };
export const TABLES_SEED = [
  { id: "T1", name: "Table 1 — Mokoena family", cap: 10, locked: false },
  { id: "T2", name: "Table 2 — Ndlovu family", cap: 10, locked: false },
  { id: "T3", name: "Table 3 — Extended family", cap: 10, locked: false },
  { id: "T4", name: "Table 4 — Wedding party", cap: 10, locked: false },
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

// Icons re-exported for the shell/nav (Store, LayoutGrid, ShoppingBag, Banknote,
// Users, Utensils, ClipboardCheck, CalendarRange, MessageCircle, Crown).
export { Store, LayoutGrid, ShoppingBag, Banknote, Users, Utensils, ClipboardCheck, CalendarRange, MessageCircle, Crown, Heart, Palette as PaletteIcon, Sun, Moon } from "lucide-react";
