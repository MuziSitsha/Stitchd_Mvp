// Resets the local/dev Supabase project back to a clean, pitch-ready demo
// state: the canonical Junior & Nadine wedding, the confirmed-real
// investor-demo/investor-supplier accounts (if present), and each
// KEEP_CLAIMED_SUPPLIER_NAMES supplier's own illustrative track record
// (leads + paid bookings, e.g. MC Bongani Live's) all survive untouched.
// Everything else accumulated from testing — extra sandbox accounts, extra
// events, extra tickets/quotes/orders/refunds/subscribers, the whole
// message log — is wiped so a live walkthrough starts from a pristine
// screen instead of showing test clutter.
//
// Usage:
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=... node scripts/reset-demo.js
//   (or edit the two constants below for a quick local run)
//
// Safe to re-run any time between rehearsals — it's idempotent: running it
// twice in a row is a no-op the second time.

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY (get it from `npx supabase status -o env` locally, or the hosted project\'s API settings).');
  process.exit(1);
}

// Accounts and their data that must always survive a reset. Add to this
// list as the real demo narrative grows (e.g. a second supplier you start
// rehearsing with live).
const KEEP_EMAILS = [
  'test-super@stitchd.sandbox', // client — owns the canonical Junior & Nadine event
  'test-admin@stitchd.sandbox', // admin
  'test-client@stitchd.sandbox',
  'test-supplier@stitchd.sandbox',
  'sales@gubudo.com', // real business owner account
];
// Emails matched by substring — for real supplier claims tied to the
// canonical narrative, whose exact test-account email varies by when they
// were claimed. Extend this if you claim a new supplier for the demo.
const KEEP_EMAIL_SUBSTRINGS = ['investor-demo-', 'investor-supplier-'];
const KEEP_CLAIMED_SUPPLIER_NAMES = ['MC Bongani Live', 'Reel Love Films'];
// The canonical event's own real wedding squad — every SUPPLIERS_SEED name
// (data.ts), each with a real ticket (+ quote, where the narrative calls for
// one) matching what the client app already displays. Any *other* supplier's
// ticket on this event is a rehearsal artifact (e.g. whichever supplier
// gets used for a live "request confirmation" walkthrough) and gets reset
// back to a clean slate, ticket and quote both, ready for the next run.
// Frame & Story is deliberately excluded — it's a Marketplace "alternative"
// (CANDIDATE_SEED), not part of the main SUPPLIERS_SEED squad.
const CANONICAL_TICKET_SUPPLIER_NAMES = [
  'VIP Hosting', 'Oakfield Farm', 'Memories by TK', 'Taste Affair', 'Vibe Creators',
  'Reel Love Films', 'Sugar & Spice', 'MC Bongani Live', 'Glam Squad by Zanele',
  'VIP Chauffeurs', 'Shade & Shine Marquees', 'Stitch & Cut Atelier', 'Bloom Room', 'Décor Elegance',
];
const CANONICAL_CLIENT_EMAIL = 'test-super@stitchd.sandbox'; // owns the one real Junior & Nadine event

async function api(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: opts.method && opts.method !== 'GET' ? 'return=representation' : '',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok && res.status !== 404) throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status}: ${JSON.stringify(body)}`);
  return body;
}
const rest = (path, opts) => api(`/rest/v1/${path}`, opts);
const authAdmin = (path, opts) => api(`/auth/v1/admin/${path}`, opts);

async function main() {
  console.log(`Resetting demo state on ${SUPABASE_URL}...\n`);

  // 1. Find the canonical event and every user worth keeping.
  const allUsers = (await authAdmin('users?per_page=200')).users;
  const keepUserIds = new Set(
    allUsers
      .filter((u) => KEEP_EMAILS.includes(u.email) || KEEP_EMAIL_SUBSTRINGS.some((s) => u.email.includes(s)))
      .map((u) => u.id),
  );

  const keptSuppliers = await rest(`suppliers?select=id,name,profile_id&name=in.(${KEEP_CLAIMED_SUPPLIER_NAMES.map((n) => encodeURIComponent(n)).join(',')})`);
  for (const s of keptSuppliers) if (s.profile_id) keepUserIds.add(s.profile_id);
  const keepSupplierIds = new Set(keptSuppliers.map((s) => s.id));

  // Broader than keepSupplierIds — every wedding-squad supplier's own
  // leads/track-record orders survive a reset too, not just the claimable
  // ones. (A user can still only ever claim one of KEEP_CLAIMED_SUPPLIER_NAMES.)
  const narrativeSuppliers = await rest(`suppliers?select=id,name&name=in.(${CANONICAL_TICKET_SUPPLIER_NAMES.map((n) => encodeURIComponent(n)).join(',')})`);
  const narrativeSupplierIds = new Set(narrativeSuppliers.map((s) => s.id));

  // A user should only ever claim one supplier at a time — the portal's own
  // "find my listing" lookup assumes exactly one row per profile_id, and
  // silently misbehaves (drops one of the claims) if that's ever violated.
  // Caught this for real once already: fix it defensively on every reset.
  const allClaims = await rest('suppliers?select=id,name,profile_id&profile_id=not.is.null');
  const claimsByUser = new Map();
  for (const s of allClaims) {
    if (!claimsByUser.has(s.profile_id)) claimsByUser.set(s.profile_id, []);
    claimsByUser.get(s.profile_id).push(s);
  }
  for (const [userId, claims] of claimsByUser) {
    if (claims.length <= 1) continue;
    const keeper = claims.find((c) => keepSupplierIds.has(c.id)) ?? claims[0];
    for (const c of claims) {
      if (c.id === keeper.id) continue;
      await rest(`suppliers?id=eq.${c.id}`, { method: 'PATCH', body: JSON.stringify({ profile_id: null }) });
      console.log(`Fixed a double-claim: released "${c.name}" (kept "${keeper.name}") for the same account.`);
    }
  }

  const canonicalClientId = allUsers.find((u) => u.email === CANONICAL_CLIENT_EMAIL)?.id;
  const events = await rest('events?select=id,owner_id,guest_count');
  const canonicalEvent = events.find((e) => e.owner_id === canonicalClientId);
  const keepEventIds = new Set(events.filter((e) => keepUserIds.has(e.owner_id)).map((e) => e.id));
  if (!canonicalEvent) console.warn(`WARNING: could not find an event owned by ${CANONICAL_CLIENT_EMAIL} — check CANONICAL_CLIENT_EMAIL.`);
  console.log(`Keeping ${keepUserIds.size} users, ${keepEventIds.size} event(s).`);

  // 2. Reset any rehearsal ticket/quote sitting on the canonical event for a
  //    supplier outside the original narrative (cascades to that ticket's
  //    quote/quote_versions/quote_items automatically) — this is what makes
  //    the "request a fresh supplier live" demo beat repeatable.
  if (canonicalEvent) {
    const canonicalTickets = await rest(`supplier_tickets?select=id,suppliers(name)&event_id=eq.${canonicalEvent.id}`);
    const rehearsalTickets = canonicalTickets.filter((t) => !CANONICAL_TICKET_SUPPLIER_NAMES.includes(t.suppliers?.name));
    for (const t of rehearsalTickets) await rest(`supplier_tickets?id=eq.${t.id}`, { method: 'DELETE' });
    console.log(`Reset ${rehearsalTickets.length} rehearsal ticket(s) on the canonical event: ${rehearsalTickets.map((t) => t.suppliers?.name).join(', ') || '(none)'}`);
  }

  // 3. Unclaim any supplier owned by a user about to be deleted.
  const claimed = await rest('suppliers?select=id,name,profile_id&profile_id=not.is.null');
  const toUnclaim = claimed.filter((s) => !keepUserIds.has(s.profile_id));
  for (const s of toUnclaim) {
    await rest(`suppliers?id=eq.${s.id}`, { method: 'PATCH', body: JSON.stringify({ profile_id: null }) });
  }
  console.log(`Unclaimed ${toUnclaim.length} test-claimed supplier(s): ${toUnclaim.map((s) => s.name).join(', ') || '(none)'}`);

  // 4. Wipe the pure operational/log tables entirely — always safe, always
  //    regenerable.
  for (const table of ['message_log', 'webhook_deliveries', 'activity_log', 'ticket_comments', 'ticket_transitions', 'tickets', 'lead_messages']) {
    await rest(`${table}?id=not.is.null`, { method: 'DELETE' });
  }
  console.log('Cleared message_log, webhook_deliveries, activity_log, tickets (+ comments/transitions).');

  // 4b. Leads are Stitch-It illustrative data — keep the ones that belong to
  //    a wedding-squad supplier (a demo supplier's real lead pipeline, e.g.
  //    MC Bongani Live's), delete anything else.
  const leads = await rest('leads?select=id,supplier_id');
  const leadsToDelete = leads.filter((l) => !narrativeSupplierIds.has(l.supplier_id));
  for (const l of leadsToDelete) await rest(`leads?id=eq.${l.id}`, { method: 'DELETE' });
  console.log(`Kept ${leads.length - leadsToDelete.length} lead(s) for demo suppliers, deleted ${leadsToDelete.length} other lead(s).`);

  // 5. Delete non-canonical orders — refunds first (no cascade there), then
  //    the order itself (order_items cascade automatically). Keeps the 6
  //    original seed orders plus any order with a line item for a
  //    wedding-squad supplier (e.g. MC Bongani Live's illustrative booking
  //    history).
  const orders = await rest('orders?select=id,ref');
  const CANONICAL_ORDER_REFS = ['ST-BKG-00001', 'ST-BKG-00002', 'ST-BKG-00003', 'ST-BKG-00004', 'ST-BKG-00005', 'ST-BKG-00006'];
  const demoOrderItems = await rest(`order_items?select=order_id&supplier_id=in.(${[...narrativeSupplierIds].join(',')})`);
  const demoOrderIds = new Set(demoOrderItems.map((oi) => oi.order_id));
  const ordersToDelete = orders.filter((o) => !CANONICAL_ORDER_REFS.includes(o.ref) && !demoOrderIds.has(o.id));
  for (const o of ordersToDelete) {
    await rest(`refunds?order_id=eq.${o.id}`, { method: 'DELETE' });
    await rest(`orders?id=eq.${o.id}`, { method: 'DELETE' });
  }
  console.log(`Deleted ${ordersToDelete.length} test order(s), kept the ${CANONICAL_ORDER_REFS.length} canonical seed orders + ${demoOrderIds.size} demo-supplier booking(s).`);

  // 6. Delete non-canonical subscribers.
  const subs = await rest('subscribers?select=id,user_id');
  for (const s of subs) if (!keepUserIds.has(s.user_id)) await rest(`subscribers?id=eq.${s.id}`, { method: 'DELETE' });

  // 7. Delete non-canonical events (cascades supplier_tickets -> quotes ->
  //    quote_versions/quote_items, and budget_payments).
  const eventsToDelete = events.filter((e) => !keepEventIds.has(e.id));
  for (const e of eventsToDelete) await rest(`events?id=eq.${e.id}`, { method: 'DELETE' });
  console.log(`Deleted ${eventsToDelete.length} test event(s).`);

  // 8. Safety net: a supplier's claim can change hands (as it just did),
  //    but the *old* owner can still be `created_by` on a surviving quote
  //    version (or `actor_id` on a surviving refund) — deleting them would
  //    hit a foreign-key error. Whoever still authored a row that made it
  //    through the cleanup above stays, no matter which account currently
  //    holds the claim.
  const survivingQuoteAuthors = await rest('quote_versions?select=created_by');
  for (const q of survivingQuoteAuthors) keepUserIds.add(q.created_by);
  const survivingRefundActors = await rest('refunds?select=actor_id');
  for (const r of survivingRefundActors) keepUserIds.add(r.actor_id);

  // 9. Delete non-canonical role_assignments, then the auth users themselves
  //    (cascades their `profiles` row).
  const usersToDelete = allUsers.filter((u) => !keepUserIds.has(u.id));
  for (const u of usersToDelete) {
    await rest(`role_assignments?user_id=eq.${u.id}`, { method: 'DELETE' });
    await authAdmin(`users/${u.id}`, { method: 'DELETE' });
  }
  console.log(`Deleted ${usersToDelete.length} test user(s).`);

  console.log('\nDone. Canonical demo state restored — ready to rehearse.');
}

main().catch((e) => { console.error(e); process.exit(1); });
