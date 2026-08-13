// Ported originally from stitchd-v9.jsx lines 92-129 — the prototype embeds
// these photos as inline base64 data URIs (EF_M/EF_F/ES_POOL). They were
// extracted once (scratchpad/extract-photos.js, decoding each data URI and
// writing it to a real file) into public/photos/ so the app references them
// as normal static assets instead of inline base64 per bundle. ES_POOL was
// later expanded (indices 17+) with South African–sourced photography so
// every real supplier category and wedding-squad role gets its own distinct
// image — see CATEGORY_PHOTO below.
const EF_M_FILES = ["ef-m-0.jpg", "ef-m-1.jpg", "ef-m-2.jpg", "ef-m-3.jpg", "ef-m-4.jpg", "ef-m-5.jpg", "ef-m-6.jpg", "ef-m-7.jpg"];
const EF_F_FILES = ["ef-f-0.jpg", "ef-f-1.jpg", "ef-f-2.jpg", "ef-f-3.jpg", "ef-f-4.jpg", "ef-f-5.jpg", "ef-f-6.jpg", "ef-f-7.jpg", "ef-f-8.jpg"];
const ES_POOL_FILES = [
  "es-pool-0.jpg", "es-pool-1.jpg", "es-pool-2.jpg", "es-pool-3.jpg", "es-pool-4.jpg",
  "es-pool-5.jpg", "es-pool-6.jpg", "es-pool-7.jpg", "es-pool-8.jpg", "es-pool-9.jpg",
  "es-pool-10.jpg", "es-pool-11.jpg", "es-pool-12.jpg", "es-pool-13.jpg", "es-pool-14.jpg",
  "es-pool-15.jpg", "es-pool-16.jpg", "es-pool-17.jpg", "es-pool-18.jpg", "es-pool-19.jpg",
  "es-pool-20.jpg", "es-pool-21.jpg", "es-pool-22.jpg", "es-pool-23.jpg", "es-pool-24.jpg",
  "es-pool-25.jpg", "es-pool-26.jpg", "es-pool-27.jpg", "es-pool-28.jpg", "es-pool-29.jpg",
  "es-pool-30.jpg", "es-pool-31.jpg", "es-pool-32.jpg", "es-pool-33.jpg", "es-pool-34.jpg",
  "es-pool-35.jpg",
];

export const EF_M = EF_M_FILES.map((f) => `/photos/${f}`);
export const EF_F = EF_F_FILES.map((f) => `/photos/${f}`);
export const EF_GROOM = 0;
export const EF_BRIDE = 0;

// Coach Lungi gets her own dedicated photo, not a pool index — without this,
// `hash("coach")` happens to land on the same EF_F[0] slot as Nadine (the
// bride), so the coach and the client were silently showing the identical
// face. Kept outside EF_F entirely so no other hash-selected card can ever
// coincidentally land on it either.
export const EF_COACH = "/photos/ef-coach.jpg";

// Deterministic face assignment for the 16 GUESTS_SEED wedding guests, keyed
// by guest id. Without this, Face.tsx's hash(seed) % pool.length fallback
// (only 13 photos originally) guaranteed collisions across 16+ named guests
// — confirmed live: 5 different guests all rendered EF_F[4], and several
// male-named guests (Tshepo, Vusi, Bongani, Thabo) were hashed into the
// female pool since the fallback's gender guess is just hash-parity, not
// real data. Every guest below gets its own index, matched to the gender the
// real name implies, sourced from the same verified-license South African
// photo batches as the rest of the app. `g13` (a baby) and the Coach's other
// clients (`w1`/`w3`/`w4` in BOOK, a lower-visibility surface) are
// deliberately left off this map — they still use the hash fallback, now
// spread across 17 photos instead of 13, an acceptable residual risk for a
// less-prominent surface rather than a 20th sourced photo for marginal gain.
export const GUEST_FACE: Record<string, string> = {
  g1: `/photos/${EF_F_FILES[1]}`, // Grace Mokoena
  g2: `/photos/${EF_M_FILES[1]}`, // Solomon Mokoena
  g3: `/photos/${EF_F_FILES[2]}`, // Thandi Ndlovu
  g4a: `/photos/${EF_M_FILES[2]}`, // Sipho Mokoena
  g4b: `/photos/${EF_F_FILES[3]}`, // Lerato Mokoena
  g5: `/photos/${EF_F_FILES[4]}`, // Zanele Ndlovu
  g6: `/photos/${EF_M_FILES[7]}`, // Kagiso Molefe
  g7a: `/photos/${EF_F_FILES[5]}`, // Amahle Zulu
  g7b: `/photos/${EF_M_FILES[3]}`, // Bongani Zulu
  g8: `/photos/${EF_F_FILES[6]}`, // Refilwe Khumalo
  g9: `/photos/${EF_M_FILES[4]}`, // Tshepo Radebe
  g10a: `/photos/${EF_F_FILES[7]}`, // Naledi Dube
  g10b: `/photos/${EF_M_FILES[5]}`, // Thabo Dube
  g11: `/photos/${EF_F_FILES[8]}`, // Palesa Ndlovu
  g12: `/photos/${EF_M_FILES[6]}`, // Vusi Mokoena
};

// A handful of the source photos above are editorial shots (rule-of-thirds
// portrait, side profile, mid-action) rather than dead-centre headshots —
// fine full-size, but `object-fit: cover`'s default center crop cuts them
// oddly at avatar size (28-46px). Path → CSS `object-position` override,
// checked by Face.tsx; anything not listed keeps the "center" default.
export const FACE_POS: Record<string, string> = {
  "/photos/ef-m-7.jpg": "35% 30%", // Kagiso — side-profile, face left-of-centre
  "/photos/ef-f-8.jpg": "50% 15%", // Palesa — raised arms push the face up top
  "/photos/ef-f-7.jpg": "35% 25%", // Naledi — singing into a mic, head turned left
};

export const ES_POOL = ES_POOL_FILES.map((f) => `/photos/${f}`);

// Ported exactly from stitchd-v9.jsx line 132 — indexed with % so it wraps
// across all 9 palettes from just 5 entries, same as the original.
export const ES_PAL = [1, 3, 0, 2, 4];

// Single source of truth for "what photo does this card show." Keyed by
// three kinds of string that all resolve into the same 36-photo pool, so a
// given real-world business/category never renders two different photos
// depending on which lens is looking at it:
//  - the 14 wedding-squad `role` strings (Squad/Suppliers/SupplierDrawer)
//  - the 26 real `suppliers.category` strings from Supabase (SupplierPortalLens)
//  - the 12 short HIRE keys (`marquee`, `seating`, ...) used by StitchIt's
//    hire grid, which is seeded from the same 12 categories
// Every one of the 26 real categories + 14 roles gets its own distinct
// index — confirmed against a live `select category, count(*) ... group by
// category` query (26 rows; only "Chairs & Tables" and "Marquees & Tents"
// hold 2 suppliers each). Those two get a second synthetic key ("seating2",
// "marquee2") so the two suppliers sharing a category still get different
// photos — see the inline ternaries at each call site that passes one.
export const CATEGORY_PHOTO: Record<string, number> = {
  // Wedding-squad roles (== real category string for the same 14 businesses)
  Planner: 23,
  Venue: 0,
  Photography: 3,
  Catering: 22,
  Entertainment: 27,
  Videography: 18,
  Cake: 8,
  MC: 6,
  "Hair & Makeup": 21,
  Transport: 5,
  "Tent & Weather": 9,
  Tailor: 17,
  "Flower Specialist": 25,
  "Décor Supplier": 24,
  // Short HIRE keys (StitchIt.tsx `h.cat`)
  marquee: 29,
  marquee2: 30,
  seating: 1,
  seating2: 35,
  sound: 28,
  catering: 7,
  castle: 20,
  bar: 32,
  loos: 34,
  decor: 26,
  power: 33,
  cold: 31,
  booth: 19,
  coffee: 14,
  // Full real category strings (SupplierPortalLens.tsx, from Supabase)
  "Marquees & Tents": 29,
  "Chairs & Tables": 1,
  "Sound & DJ": 28,
  "Food & Braai": 7,
  "Jumping Castles": 20,
  "Mobile Bar": 32,
  "VIP Loos": 34,
  "Décor & Draping": 26,
  "Power & Generators": 33,
  "Cold Rooms": 31,
  "Photo Booth": 19,
  "Coffee Cart": 14,
};
