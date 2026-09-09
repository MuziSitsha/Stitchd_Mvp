import { useEffect, useState, useCallback, useMemo, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { BadgeCheck, Star, Sparkles, TrendingUp, Plus, X, ShieldCheck, ArrowLeftRight, MessageCircle, Calendar, AlertTriangle, LifeBuoy, ChevronLeft, ChevronRight, Camera, CheckCircle2, Pencil } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { supabase } from "../lib/supabase";
import { respondToLead, startBoostCheckout, confirmSupplierTicket, respondToSupplierTicket, friendlyPaymentError, createQuote } from "../lib/functions";
import { computeSupplierStats, computeWeeklyEarnings, groupOrderItems, type OrderItemRow } from "../lib/supplierStats";
import { PortalShell, PortalCard, StatTile, StatusChip, ConfirmDialog } from "../components/PortalShell";
import { TicketThread } from "../components/proto/TicketThread";
import { LeadThreadPanel } from "../components/proto/LeadThreadPanel";
import { TicketV2Card, TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from "../components/proto/TicketV2Card";
import { ImageUpload } from "../components/proto/ImageUpload";
import { CATEGORIES } from "./SupplierClaim";
import { PRICING_UNITS, pricePreview as pricePreviewFor, priceLabel, type PricingUnit } from "../lib/pricing";

const TICKET_CATEGORIES = ["supplier_delay", "payment", "venue", "guest", "task", "platform_support", "dispute", "other"] as const;
const TICKET_PRIORITIES = ["low", "medium", "high", "critical"] as const;

const LISTING_STATUS_LABEL: Record<string, string> = { pending: "Awaiting review", active: "Live", paused: "Paused", suspended: "Suspended", declined: "Not approved" };
const LISTING_STATUS_TONE: Record<string, "good" | "warn" | "bad" | "accent" | "faint"> = { pending: "warn", active: "good", paused: "faint", suspended: "bad", declined: "bad" };

interface Supplier {
  id: string;
  category: string;
  name: string;
  headline: string | null;
  bio: string | null;
  rating: number | null;
  review_count: number;
  verified: boolean;
  status: string;
  price_from_cents: number | null;
  pricing_unit: string;
  photo_url: string | null;
  service_area: string | null;
  phone: string | null;
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

interface SupplierTicket {
  id: string;
  ref: string;
  status: "pending" | "confirmed";
  created_at: string;
}

interface PromotionRow {
  id: string;
  ref: string;
  title: string;
  description: string | null;
  discount_label: string | null;
  applicable_date: string | null;
  status: "draft" | "published" | "unpublished";
  created_at: string;
}

interface QuoteVersionRow {
  version: number;
  total_cents: number;
  note: string | null;
  created_at: string;
  quote_items: { label: string; qty: number; unit_price_cents: number; line_total_cents: number }[];
}

interface QuoteRow {
  id: string;
  ref: string;
  status: string;
  current_version: number;
  ticket_id: string;
  supplier_tickets: { ref: string } | null;
  quote_versions: QuoteVersionRow[];
}

interface AvailabilityOverride {
  date: string;
  status: "open" | "blocked" | "promo";
}

interface SupportTicket {
  id: string;
  ref: string;
  category: string;
  priority: string;
  status: string;
  resolution_summary: string | null;
  created_at: string;
  event_id: string | null;
  events: { event_date: string | null; type: string } | null;
}

interface DatedTicket {
  id: string;
  ref: string;
  status: "pending" | "confirmed";
  event_id: string;
  events: { event_date: string | null; type: string } | null;
}

const rand = (cents: number) => `R${Math.round(cents / 100).toLocaleString("en-ZA")}`;

export function SupplierPortal() {
  const { T } = useTheme();
  const [supplier, setSupplier] = useState<Supplier | null | undefined>(undefined);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rank, setRank] = useState<RankRow | null>(null);
  const [categoryCount, setCategoryCount] = useState(0);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [tickets, setTickets] = useState<SupplierTicket[]>([]);
  const [datedTickets, setDatedTickets] = useState<DatedTicket[]>([]);
  const [confirmingRef, setConfirmingRef] = useState<string | null>(null);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [openLeadThreadId, setOpenLeadThreadId] = useState<string | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [availability, setAvailability] = useState<AvailabilityOverride[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [quoteTicketRef, setQuoteTicketRef] = useState("");
  const [editingQuote, setEditingQuote] = useState(false);
  const [viewVersion, setViewVersion] = useState<number | null>(null);
  const [quoteDraftItems, setQuoteDraftItems] = useState<{ label: string; qty: number; unit_price_cents: number }[]>([]);
  const [quoteItemLabel, setQuoteItemLabel] = useState("");
  const [quoteItemQty, setQuoteItemQty] = useState("1");
  const [quoteItemPrice, setQuoteItemPrice] = useState("");
  const [sendingQuote, setSendingQuote] = useState(false);
  const [myCategories, setMyCategories] = useState<string[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [newPromoTitle, setNewPromoTitle] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("");
  const [newPromoDate, setNewPromoDate] = useState("");
  const [newPromoDescription, setNewPromoDescription] = useState("");
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [openSupportId, setOpenSupportId] = useState<string | null>(null);
  const [newTicketCategory, setNewTicketCategory] = useState<(typeof TICKET_CATEGORIES)[number]>("platform_support");
  const [newTicketPriority, setNewTicketPriority] = useState<(typeof TICKET_PRIORITIES)[number]>("medium");
  const [newTicketEventId, setNewTicketEventId] = useState("");
  const [newTicketBody, setNewTicketBody] = useState("");
  const [creatingSupportTicket, setCreatingSupportTicket] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [addonLabel, setAddonLabel] = useState("");
  const [addonPrice, setAddonPrice] = useState("");
  const [addonSubmitting, setAddonSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);

  // "Edit your listing" — nothing set at onboarding could be changed
  // afterward until now. Draft fields only, so a supplier can back out
  // without partial edits leaking into the read-only view.
  const [editingListing, setEditingListing] = useState(false);
  const [editCategory, setEditCategory] = useState("");
  const [editExtraCategories, setEditExtraCategories] = useState<Set<string>>(new Set());
  const [editHeadline, setEditHeadline] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPricingUnit, setEditPricingUnit] = useState<PricingUnit>("total");
  const [editPriceRand, setEditPriceRand] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editServiceArea, setEditServiceArea] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editUploadingPhoto, setEditUploadingPhoto] = useState(false);
  const [savingListing, setSavingListing] = useState(false);
  const navigate = useNavigate();

  const loadSupplier = useCallback(async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      navigate("/supplier/login");
      return;
    }
    const { data, error: fetchError } = await supabase
      .from("suppliers")
      .select("id, category, name, headline, bio, rating, review_count, verified, status, price_from_cents, pricing_unit, photo_url, service_area, phone")
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

    const loadTickets = () => {
      supabase
        .from("supplier_tickets")
        .select("id, ref, status, created_at")
        .eq("supplier_id", supplier.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .then(({ data }) => setTickets((data ?? []) as SupplierTicket[]));
    };
    loadTickets();

    supabase
      .from("supplier_categories")
      .select("category")
      .eq("supplier_id", supplier.id)
      .then(({ data }) => setMyCategories((data ?? []).map((r) => r.category)));

    const loadPromotions = () => {
      supabase
        .from("promotions")
        .select("id, ref, title, description, discount_label, applicable_date, status, created_at")
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setPromotions((data ?? []) as PromotionRow[]));
    };
    loadPromotions();

    const loadQuotes = () => {
      supabase
        .from("quotes")
        .select("id, ref, status, current_version, ticket_id, supplier_tickets!inner(ref, supplier_id), quote_versions(version, total_cents, note, created_at, quote_items(label, qty, unit_price_cents, line_total_cents))")
        .eq("supplier_tickets.supplier_id", supplier.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setQuotes((data ?? []) as unknown as QuoteRow[]));
    };
    loadQuotes();

    const loadAvailability = () => {
      supabase
        .from("supplier_availability")
        .select("date, status")
        .eq("supplier_id", supplier.id)
        .then(({ data }) => setAvailability((data ?? []) as AvailabilityOverride[]));
    };
    loadAvailability();

    const loadSupportTickets = () => {
      supabase
        .from("tickets")
        .select("id, ref, category, priority, status, resolution_summary, created_at, event_id, events(event_date, type)")
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setSupportTickets((data ?? []) as unknown as SupportTicket[]));
    };
    loadSupportTickets();

    const loadDatedTickets = () => {
      supabase
        .from("supplier_tickets")
        .select("id, ref, status, event_id, events(event_date, type)")
        .eq("supplier_id", supplier.id)
        .in("status", ["pending", "confirmed"])
        .then(({ data }) => setDatedTickets((data ?? []) as unknown as DatedTicket[]));
    };
    loadDatedTickets();

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "supplier_tickets", filter: `supplier_id=eq.${supplier.id}` },
        () => { loadTickets(); loadDatedTickets(); },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `supplier_id=eq.${supplier.id}` },
        loadSupportTickets,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "supplier_availability", filter: `supplier_id=eq.${supplier.id}` },
        loadAvailability,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, loadQuotes)
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_versions" }, loadQuotes)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promotions", filter: `supplier_id=eq.${supplier.id}` },
        loadPromotions,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supplier]);

  // Doc's Figure 2 "Revenue opportunity" widget — real pipeline value broken
  // down by category, from quotes still genuinely in play (sent or being
  // negotiated). Uses each quote's latest version only, never sums across
  // superseded revisions.
  const revenueOpportunity = useMemo(() => {
    const byLabel = new Map<string, number>();
    for (const q of quotes) {
      if (q.status !== "sent" && q.status !== "change_requested") continue;
      const latest = q.quote_versions.find((v) => v.version === q.current_version) ?? q.quote_versions[q.quote_versions.length - 1];
      if (!latest) continue;
      for (const it of latest.quote_items) {
        byLabel.set(it.label, (byLabel.get(it.label) ?? 0) + it.line_total_cents);
      }
    }
    const rows = [...byLabel.entries()].sort((a, b) => b[1] - a[1]);
    const total = rows.reduce((s, [, v]) => s + v, 0);
    return { rows, total };
  }, [quotes]);

  // Doc's "96% match" lead-pipeline scoring — deterministic and explainable
  // (SRS requires this, AI can augment later), computed from data already
  // fetched. Fresh + Stitched+ + detailed leads score highest; the score
  // decays the longer an unanswered lead sits.
  function leadMatchScore(lead: Lead): number {
    let score = 50;
    if (lead.orders && lead.orders.member_saving_cents > 0) score += 20;
    if (lead.details?.trim()) score += 15;
    const ageHours = (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) score += 10;
    score -= Math.max(0, ageHours / 24 - 2) * 10;
    return Math.max(0, Math.min(99, Math.round(score)));
  }
  const sortedLeads = useMemo(
    () => [...leads]
      .map((lead) => ({ lead, score: leadMatchScore(lead) }))
      .sort((a, b) => {
        if (a.lead.status === "new" && b.lead.status !== "new") return -1;
        if (a.lead.status !== "new" && b.lead.status === "new") return 1;
        return b.score - a.score;
      }),
    [leads],
  );

  // The Quotes card's real subject list: every one of this supplier's
  // dated bookings (pending or confirmed), each paired with its quote (if
  // any) — this is what lets a supplier pick which booking's quote to
  // view/create/revise instead of scrolling a flat list. Needs a quote
  // sent/revised comes first, so the thing most likely to need action is
  // the default selection.
  const quoteBoard = useMemo(() => {
    const byTicketId = new Map(quotes.map((q) => [q.ticket_id, q]));
    const eventLabel = (t: DatedTicket) => {
      const type = t.events?.type ?? "Event";
      const date = t.events?.event_date
        ? new Date(`${t.events.event_date}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
        : "date TBC";
      return `${type} · ${date}`;
    };
    return datedTickets
      .map((t) => ({ ticketId: t.id, ticketRef: t.ref, ticketStatus: t.status, eventLabel: eventLabel(t), quote: byTicketId.get(t.id) ?? null }))
      .sort((a, b) => {
        const rank = (q: QuoteRow | null) => (!q ? 0 : q.status === "sent" || q.status === "change_requested" ? 1 : 2);
        return rank(a.quote) - rank(b.quote) || a.ticketRef.localeCompare(b.ticketRef);
      });
  }, [datedTickets, quotes]);

  const selectedQuoteRow = useMemo(() => quoteBoard.find((r) => r.ticketRef === quoteTicketRef) ?? null, [quoteBoard, quoteTicketRef]);

  // Default to something worth looking at as soon as it's known, instead of
  // an empty picker a supplier has to know to operate.
  useEffect(() => {
    if (quoteTicketRef || quoteBoard.length === 0) return;
    setQuoteTicketRef(quoteBoard[0].ticketRef);
  }, [quoteBoard, quoteTicketRef]);

  // Switching bookings always drops back to a clean read-only view of that
  // booking's own latest version — no leaking a half-typed draft or an old
  // version number onto the newly selected quote.
  useEffect(() => {
    setEditingQuote(false);
    setViewVersion(null);
    setQuoteDraftItems([]);
  }, [quoteTicketRef]);

  function startEditQuote() {
    const latest = selectedQuoteRow?.quote?.quote_versions.find((v) => v.version === selectedQuoteRow.quote!.current_version);
    setQuoteDraftItems(latest ? latest.quote_items.map((it) => ({ label: it.label, qty: it.qty, unit_price_cents: it.unit_price_cents })) : []);
    setEditingQuote(true);
  }

  // Distinct client bookings this supplier can tie a support ticket to —
  // reuses the same real data as the Quotes board so there's no separate
  // "which client" lookup to build or keep in sync.
  const supportTicketEventOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of datedTickets) {
      if (seen.has(t.event_id)) continue;
      const date = t.events?.event_date ? new Date(`${t.events.event_date}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "date TBC";
      seen.set(t.event_id, `${t.events?.type ?? "Event"} · ${date} · ${t.ref}`);
    }
    return [...seen.entries()];
  }, [datedTickets]);

  const stats = useMemo(() => computeSupplierStats(orderItems), [orderItems]);
  const orderGroups = useMemo(() => groupOrderItems(orderItems), [orderItems]);
  const weeklyEarnings = useMemo(() => computeWeeklyEarnings(orderItems), [orderItems]);

  // Two of this supplier's own tickets sharing an event_date is a real
  // conflict — they physically can't be in two places on the same day.
  const datedByDate = useMemo(() => {
    const byDate = new Map<string, DatedTicket[]>();
    for (const t of datedTickets) {
      const d = t.events?.event_date;
      if (!d) continue;
      byDate.set(d, [...(byDate.get(d) ?? []), t]);
    }
    return byDate;
  }, [datedTickets]);
  const sortedDates = useMemo(
    () => [...datedByDate.keys()].sort((a, b) => a.localeCompare(b)),
    [datedByDate],
  );

  // Calendar cell state, in precedence order: a real booking always wins
  // over a manual override (you can't "block" a date you're already
  // confirmed on) — booked/tentative are computed from real tickets,
  // blocked/promo come from the supplier's own supplier_availability rows.
  const overrideByDate = useMemo(() => new Map(availability.map((a) => [a.date, a.status])), [availability]);
  function calendarCellState(dateStr: string): "booked" | "tentative" | "blocked" | "promo" | "open" {
    const dayTickets = datedByDate.get(dateStr);
    if (dayTickets?.some((t) => t.status === "confirmed")) return "booked";
    if (dayTickets?.some((t) => t.status === "pending")) return "tentative";
    return overrideByDate.get(dateStr) ?? "open";
  }

  // Always upserts, never deletes — reverting to "open" is a real stored
  // status flip (not a row removal), matching every other table's own
  // convention, so it gets a real audit trail too instead of vanishing.
  async function cycleAvailability(dateStr: string) {
    if (!supplier) return;
    const current = overrideByDate.get(dateStr) ?? "open";
    const next: "open" | "blocked" | "promo" = current === "open" ? "blocked" : current === "blocked" ? "promo" : "open";
    await supabase.from("supplier_availability").upsert({ supplier_id: supplier.id, date: dateStr, status: next }, { onConflict: "supplier_id,date" });
  }

  // Phase 6 — real, confirmed, upcoming bookings only (a pending ticket
  // isn't a booking yet), used just for the "next 7 days" alert; the
  // Bookings card itself renders straight off sortedDates/datedByDate so
  // upcoming + past show together instead of as two separate lists.
  const upcomingBookings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return datedTickets
      .filter((t) => t.status === "confirmed" && t.events?.event_date && t.events.event_date >= today)
      .sort((a, b) => a.events!.event_date!.localeCompare(b.events!.event_date!));
  }, [datedTickets]);

  const daysUntil = (dateStr: string) => Math.ceil((new Date(`${dateStr}T00:00:00`).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const nextWeekCount = upcomingBookings.filter((t) => daysUntil(t.events!.event_date!) <= 7).length;

  // This month's override counts, so the calendar reads as "here's what's
  // actually going on" at a glance instead of a wall of identical cells.
  const calendarMonthSummary = useMemo(() => {
    const y = calendarMonth.getFullYear(), m = calendarMonth.getMonth();
    const prefix = `${y}-${String(m + 1).padStart(2, "0")}`;
    let blocked = 0, promo = 0, booked = 0;
    for (const [date, status] of overrideByDate) {
      if (!date.startsWith(prefix)) continue;
      if (status === "blocked") blocked++;
      if (status === "promo") promo++;
    }
    for (const d of datedByDate.keys()) if (d.startsWith(prefix) && datedByDate.get(d)?.some((t) => t.status === "confirmed")) booked++;
    return { blocked, promo, booked };
  }, [calendarMonth, overrideByDate, datedByDate]);

  const attentionCount = tickets.length + leads.filter((l) => l.status === "new").length;

  async function publishPromotion(e: FormEvent) {
    e.preventDefault();
    if (!supplier || !newPromoTitle.trim()) return;
    setCreatingPromo(true);
    setError(null);
    try {
      const { error: insertErr } = await supabase.from("promotions").insert({
        supplier_id: supplier.id,
        title: newPromoTitle.trim(),
        description: newPromoDescription.trim() || null,
        discount_label: newPromoDiscount.trim() || null,
        applicable_date: newPromoDate || null,
        status: "published",
      });
      if (insertErr) throw insertErr;
      setNewPromoTitle("");
      setNewPromoDiscount("");
      setNewPromoDate("");
      setNewPromoDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish promotion");
    } finally {
      setCreatingPromo(false);
    }
  }

  async function togglePromotionStatus(promo: PromotionRow) {
    const next = promo.status === "published" ? "unpublished" : "published";
    await supabase.from("promotions").update({ status: next }).eq("id", promo.id);
  }

  function addQuoteDraftItem() {
    const price = Math.round(Number(quoteItemPrice) * 100);
    const qty = Number(quoteItemQty) || 1;
    if (!quoteItemLabel.trim() || !Number.isFinite(price) || price <= 0) return;
    setQuoteDraftItems((prev) => [...prev, { label: quoteItemLabel.trim(), qty, unit_price_cents: price }]);
    setQuoteItemLabel("");
    setQuoteItemQty("1");
    setQuoteItemPrice("");
  }

  function removeQuoteDraftItem(index: number) {
    setQuoteDraftItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitQuote(e: FormEvent) {
    e.preventDefault();
    if (!quoteTicketRef || quoteDraftItems.length === 0) return;
    setSendingQuote(true);
    setError(null);
    try {
      await createQuote(quoteTicketRef, quoteDraftItems);
      setQuoteDraftItems([]);
      setEditingQuote(false);
      // Deliberately keep quoteTicketRef selected — the supplier lands back
      // on the read-only view of the quote they just sent/revised, not a
      // blank picker.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send quote");
    } finally {
      setSendingQuote(false);
    }
  }

  async function createSupportTicket(e: FormEvent) {
    e.preventDefault();
    if (!supplier || !newTicketBody.trim()) return;
    setCreatingSupportTicket(true);
    setError(null);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("not signed in");
      const { data: created, error: createErr } = await supabase
        .from("tickets")
        .insert({
          supplier_id: supplier.id,
          event_id: newTicketEventId || null,
          category: newTicketCategory,
          priority: newTicketPriority,
          created_by: userRes.user.id,
          created_by_role: "supplier",
        })
        .select("id")
        .single();
      if (createErr) throw createErr;
      const { error: commentErr } = await supabase.from("ticket_comments").insert({
        ticket_id: created.id,
        author_id: userRes.user.id,
        author_role: "supplier",
        body: newTicketBody.trim(),
      });
      if (commentErr) throw commentErr;
      setNewTicketBody("");
      setNewTicketEventId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to raise ticket");
    } finally {
      setCreatingSupportTicket(false);
    }
  }

  async function handleRespond(leadRef: string, action: "accept" | "decline") {
    setError(null);
    try {
      await respondToLead(leadRef, action);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond to lead");
    }
  }

  async function handleConfirmTicket(ticketRef: string) {
    setConfirmingRef(ticketRef);
    setError(null);
    try {
      await confirmSupplierTicket(ticketRef);
      setTickets((prev) => prev.filter((t) => t.ref !== ticketRef));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm ticket");
    } finally {
      setConfirmingRef(null);
    }
  }

  async function handleDeclineTicket(ticketRef: string) {
    setConfirmingRef(ticketRef);
    setError(null);
    try {
      await respondToSupplierTicket(ticketRef, "decline");
      setTickets((prev) => prev.filter((t) => t.ref !== ticketRef));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline ticket");
    } finally {
      setConfirmingRef(null);
    }
  }

  async function handleBoost() {
    setBoosting(true);
    setError(null);
    try {
      const { checkout_url } = await startBoostCheckout();
      window.location.href = checkout_url;
    } catch (err) {
      setError(friendlyPaymentError(err));
      setBoosting(false);
    }
  }

  async function confirmSwitchBusiness() {
    if (!supplier) return;
    setSwitchDialogOpen(false);
    setError(null);
    const { error: releaseError } = await supabase.from("suppliers").update({ profile_id: null }).eq("id", supplier.id);
    if (releaseError) {
      setError(releaseError.message);
      return;
    }
    navigate("/supplier/claim");
  }

  function openEditListing() {
    if (!supplier) return;
    setEditCategory(supplier.category);
    setEditExtraCategories(new Set(myCategories.filter((c) => c !== supplier.category)));
    setEditHeadline(supplier.headline ?? "");
    setEditBio(supplier.bio ?? "");
    setEditPricingUnit((supplier.pricing_unit as PricingUnit) || "total");
    setEditPriceRand(supplier.price_from_cents != null ? String(supplier.price_from_cents / 100) : "");
    setEditPhone(supplier.phone ?? "");
    setEditServiceArea(supplier.service_area ?? "");
    setEditPhotoUrl(supplier.photo_url);
    setEditingListing(true);
  }

  async function handleEditPhotoFiles(files: FileList) {
    const file = files[0];
    if (!file) return;
    setEditUploadingPhoto(true);
    setError(null);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) { setEditUploadingPhoto(false); return; }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${userRes.user.id}/cover.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("supplier-photos").upload(path, file, { upsert: true });
    if (uploadErr) {
      setError(uploadErr.message);
      setEditUploadingPhoto(false);
      return;
    }
    const { data } = supabase.storage.from("supplier-photos").getPublicUrl(path);
    setEditPhotoUrl(`${data.publicUrl}?t=${Date.now()}`);
    setEditUploadingPhoto(false);
  }

  // Saving while declined doubles as "fix it and resubmit" — there was
  // otherwise no way back from a decline except raising a support ticket.
  // Saving from any other state just updates the fields in place.
  async function saveListing() {
    if (!supplier) return;
    setSavingListing(true);
    setError(null);
    const priceCents = editPricingUnit === "quote_only" ? null : Math.round((parseFloat(editPriceRand) || 0) * 100);
    const nextStatus = supplier.status === "declined" ? "pending" : supplier.status;
    const { error: updateErr } = await supabase
      .from("suppliers")
      .update({
        category: editCategory,
        headline: editHeadline.trim() || null,
        bio: editBio.trim() || null,
        pricing_unit: editPricingUnit,
        price_from_cents: priceCents,
        phone: editPhone.trim() || null,
        service_area: editServiceArea.trim() || null,
        photo_url: editPhotoUrl,
        status: nextStatus,
      })
      .eq("id", supplier.id);
    if (updateErr) {
      setError(updateErr.message);
      setSavingListing(false);
      return;
    }

    const nextCategories = [...new Set([editCategory, ...editExtraCategories])];
    await supabase.from("supplier_categories").delete().eq("supplier_id", supplier.id);
    const { error: catErr } = await supabase.from("supplier_categories").insert(nextCategories.map((category) => ({ supplier_id: supplier.id, category })));
    if (catErr) setError(`Saved, but categories failed to update: ${catErr.message}`);

    setMyCategories(nextCategories);
    setSupplier({ ...supplier, category: editCategory, headline: editHeadline.trim() || null, bio: editBio.trim() || null, pricing_unit: editPricingUnit, price_from_cents: priceCents, phone: editPhone.trim() || null, service_area: editServiceArea.trim() || null, photo_url: editPhotoUrl, status: nextStatus });
    setSavingListing(false);
    setEditingListing(false);
  }

  // Only ever flips between the supplier's own two reversible states — a
  // 'pending' application or a 'declined'/'suspended' listing needs an
  // admin action, not a self-service toggle, so this is a no-op outside
  // active/paused (the .in() below is the real guard; the render layer
  // just never shows this button in those states to begin with).
  async function toggleListingStatus() {
    if (!supplier || (supplier.status !== "active" && supplier.status !== "paused")) return;
    setTogglingStatus(true);
    setError(null);
    const nextStatus = supplier.status === "active" ? "paused" : "active";
    const { error: statusError } = await supabase.from("suppliers").update({ status: nextStatus }).eq("id", supplier.id).in("status", ["active", "paused"]);
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

  const btnA = { background: T.accent, color: T.onAccent };
  const btnDark = { background: "#1A1726", color: "#fff" };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  if (supplier === undefined) {
    return (
      <PortalShell title="Loading…">
        <PortalCard T={T}><span style={{ color: T.sub }}>Loading your listing…</span></PortalCard>
      </PortalShell>
    );
  }
  if (supplier === null) return null;

  return (
    <PortalShell eyebrow={supplier.category} title={supplier.name} right={<StatusChip T={T} tone={LISTING_STATUS_TONE[supplier.status] ?? "faint"}>{LISTING_STATUS_LABEL[supplier.status] ?? supplier.status}</StatusChip>}>
      {/* HERO */}
      <PortalCard T={T} style={{ background: "#1A1726", borderColor: "#1A1726" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {supplier.photo_url && (
              <img src={supplier.photo_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            )}
            <div className="min-w-0">
              <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 22, color: "#fff" }}>{supplier.name}</div>
            <div className="mt-1 text-sm" style={{ color: rgba("#fff", 0.7) }}>
              {supplier.category}{supplier.headline ? ` · ${supplier.headline}` : ""}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {supplier.verified && <StatusChip T={T} tone="good"><ShieldCheck size={10} />Verified</StatusChip>}
              {rank?.featured && <StatusChip T={T} tone="accent"><Sparkles size={10} />Featured</StatusChip>}
              {supplier.rating && <StatusChip T={T} tone="warn"><Star size={10} />{supplier.rating} ({supplier.review_count})</StatusChip>}
            </div>
            {supplier.status === "active" ? (
              rank ? (
                <div className="mt-2.5 text-xs" style={{ color: rgba("#fff", 0.75) }}>
                  Ranked <b style={{ color: "#fff" }}>#{rank.rank_in_category}</b> of {categoryCount} in {supplier.category}
                  {!rank.featured && " — Boost to move to the top."}
                </div>
              ) : (
                <div className="mt-2.5 text-xs" style={{ color: rgba("#fff", 0.6) }}>Not yet ranked — check back once client searches start rolling in.</div>
              )
            ) : supplier.status === "pending" ? (
              <div className="mt-2.5 text-xs" style={{ color: rgba("#fff", 0.6) }}>Your listing is with admin for review — we'll message you the moment it's approved and live.</div>
            ) : supplier.status === "declined" ? (
              <div className="mt-2.5 text-xs" style={{ color: rgba("#fff", 0.6) }}>This listing wasn't approved — raise a support ticket below if you'd like to know more.</div>
            ) : supplier.status === "suspended" ? (
              <div className="mt-2.5 text-xs" style={{ color: rgba("#fff", 0.6) }}>This listing has been suspended by admin and isn't visible to clients.</div>
            ) : (
              <div className="mt-2.5 text-xs" style={{ color: rgba("#fff", 0.6) }}>Paused listings don't appear in client search or rankings.</div>
            )}
            </div>
          </div>
          <button onClick={() => setSwitchDialogOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: rgba("#fff", 0.12), color: "#fff" }}>
            <ArrowLeftRight size={12} />Switch listing
          </button>
        </div>
      </PortalCard>

      {error && (
        <div className="rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>{error}</div>
      )}

      {/* YOUR NUMBERS */}
      <PortalCard T={T}>
        <div className="mb-3 text-sm font-bold">Your numbers</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile T={T} value={rand(stats.earnings30d)} label="Earnings 30d" color={T.good} />
          <StatTile T={T} value={stats.ordersCount} label="Paid orders" />
          <StatTile T={T} value={supplier.rating ?? "—"} label="Rating" color={T.gold} />
          <StatTile T={T} value={`${stats.repeatPct}%`} label="Repeat" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {supplier.status === "active" || supplier.status === "paused" ? (
            <button onClick={toggleListingStatus} disabled={togglingStatus} className="press rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60" style={supplier.status === "active" ? btnG : btnA}>
              {supplier.status === "active" ? "Listing live — pause it" : "Listing paused — make it live"}
            </button>
          ) : (
            <span className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: rgba(supplier.status === "pending" ? T.warn : T.bad, 0.1), color: supplier.status === "pending" ? T.warn : T.bad }}>
              {LISTING_STATUS_LABEL[supplier.status] ?? supplier.status} — {supplier.status === "pending" ? "admin will review it shortly" : "contact support if you have questions"}
            </span>
          )}
          {priceLabel(supplier.pricing_unit, supplier.price_from_cents) && (
            <span className="text-xs" style={{ color: T.sub }}>Rate: <b style={{ color: T.ink }}>{priceLabel(supplier.pricing_unit, supplier.price_from_cents)}</b></span>
          )}
        </div>
        <div className="mt-2.5 text-xs" style={{ color: T.faint }}>
          Payouts are handled manually for now — {rand(orderItems.filter((oi) => oi.orders.status === "paid").reduce((s, oi) => s + oi.line_total_cents, 0))} earned lifetime via Stitchd.
        </div>
      </PortalCard>

      {/* EDIT YOUR LISTING — nothing set at onboarding could be changed
          afterward before this. Saving while declined also resubmits for
          review (sets status back to 'pending') — the only way back from a
          decline that isn't "raise a support ticket". */}
      <PortalCard T={T}>
        {!editingListing ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold">Your listing details</div>
              <div className="mt-0.5 text-xs" style={{ color: T.sub }}>
                {supplier.status === "declined" ? "Fix anything below and resubmit for review." : "Category, pricing, description, contact, and photo."}
              </div>
            </div>
            <button onClick={openEditListing} className="press flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={btnG}>
              <Pencil size={12} />{supplier.status === "declined" ? "Fix & resubmit" : "Edit listing"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-bold">Edit your listing</div>

            <div>
              <div className="mb-1.5 text-xs font-bold" style={{ color: T.sub }}>PRIMARY CATEGORY</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditCategory(c)}
                    className="flex items-center justify-between gap-1 rounded-xl border p-2 text-left text-xs font-semibold"
                    style={{ borderColor: editCategory === c ? T.accent : T.border, background: editCategory === c ? rgba(T.accent, 0.1) : T.panel2 }}
                  >
                    {c}
                    {editCategory === c && <CheckCircle2 size={12} className="shrink-0" style={{ color: T.accent }} />}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-bold" style={{ color: T.sub }}>ALSO OFFER (optional)</div>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter((c) => c !== editCategory).map((c) => {
                  const on = editExtraCategories.has(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setEditExtraCategories((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; })}
                      className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                      style={{ borderColor: on ? T.accent : T.border, background: on ? T.accent : T.panel2, color: on ? T.onAccent : T.ink }}
                    >
                      {c}{on ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Headline</div>
              <input value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
            </label>
            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>About your business</div>
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={{ ...inputS, minHeight: 90 }} />
            </label>

            <div>
              <div className="mb-1.5 text-xs font-bold" style={{ color: T.sub }}>PRICING</div>
              <div className="space-y-1.5">
                {PRICING_UNITS.map((u) => (
                  <button
                    key={u.key}
                    onClick={() => setEditPricingUnit(u.key)}
                    className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: editPricingUnit === u.key ? T.accent : T.border, background: editPricingUnit === u.key ? rgba(T.accent, 0.1) : T.panel2 }}
                  >
                    <div className="text-left">
                      <div className="font-semibold">{u.label}</div>
                      <div className="text-xs" style={{ color: T.sub }}>{u.hint}</div>
                    </div>
                    {editPricingUnit === u.key && <CheckCircle2 size={16} className="shrink-0" style={{ color: T.accent }} />}
                  </button>
                ))}
              </div>
              {editPricingUnit !== "quote_only" && (
                <input type="number" min={0} inputMode="decimal" value={editPriceRand} onChange={(e) => setEditPriceRand(e.target.value)} placeholder="Amount (R)" className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
              )}
              <div className="mt-1.5 text-xs" style={{ color: T.faint }}>Clients will see: <b style={{ color: T.ink }}>{pricePreviewFor(editPricingUnit, editPriceRand)}</b></div>
            </div>

            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Phone number</div>
              <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
            </label>
            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Service area</div>
              <input value={editServiceArea} onChange={(e) => setEditServiceArea(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
            </label>

            <div>
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Cover photo</div>
              <ImageUpload
                onFiles={handleEditPhotoFiles}
                multiple={false}
                disabled={editUploadingPhoto}
                className="flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed text-center"
                style={{ borderColor: rgba(T.ink, 0.22), background: rgba(T.ink, 0.04), height: 140 }}
              >
                {editPhotoUrl ? (
                  <img src={editPhotoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Camera size={20} style={{ color: T.faint }} />
                    <span className="text-xs font-semibold" style={{ color: T.sub }}>{editUploadingPhoto ? "Uploading…" : "Add a cover photo"}</span>
                  </>
                )}
              </ImageUpload>
            </div>

            {supplier.status === "declined" && (
              <div className="rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ background: rgba(T.warn, 0.1), color: T.warn }}>
                Saving resubmits this listing for admin review.
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={saveListing} disabled={savingListing || !editCategory} className="press flex-1 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60" style={btnA}>
                {savingListing ? "Saving…" : supplier.status === "declined" ? "Save & resubmit" : "Save changes"}
              </button>
              <button onClick={() => setEditingListing(false)} disabled={savingListing} className="press rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60" style={btnG}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </PortalCard>

      {/* NEEDS YOUR ATTENTION — merges confirmation requests + new leads into
          one actionable inbox, right up top where it belongs instead of
          buried under a screen of scrolling. */}
      {attentionCount > 0 && (
        <PortalCard T={T} style={{ borderColor: rgba(T.warn, 0.4), background: rgba(T.warn, 0.05) }}>
          <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: T.warn }}><AlertTriangle size={14} />Needs your attention ({attentionCount})</div>

          {tickets.length > 0 && (
            <div className="mt-2.5 space-y-2">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border p-2.5" style={{ borderColor: rgba(T.warn, 0.4), background: T.panel }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{ticket.ref} <span className="font-normal" style={{ color: T.sub }}>· confirm for the wedding</span></div>
                      <div className="text-[11px]" style={{ color: T.sub }}>Requested {new Date(ticket.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button onClick={() => setOpenThreadId(openThreadId === ticket.id ? null : ticket.id)} className="press flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={btnG}>
                        <MessageCircle size={11} />Message
                      </button>
                      <button onClick={() => handleConfirmTicket(ticket.ref)} disabled={confirmingRef === ticket.ref} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
                        {confirmingRef === ticket.ref ? "Working…" : "Yes, confirm"}
                      </button>
                      <button onClick={() => handleDeclineTicket(ticket.ref)} disabled={confirmingRef === ticket.ref} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnG}>
                        {confirmingRef === ticket.ref ? "Working…" : "No"}
                      </button>
                    </div>
                  </div>
                  {openThreadId === ticket.id && (
                    <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: rgba(T.warn, 0.3) }}>
                      <TicketThread T={T} ticketId={ticket.id} senderRole="supplier" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sortedLeads.some(({ lead }) => lead.status === "new") && (
            <div className="mt-2.5 space-y-2">
              {sortedLeads.filter(({ lead }) => lead.status === "new").map(({ lead, score }) => (
                <div key={lead.id} className="rounded-xl border p-2.5" style={{ borderColor: T.border, background: T.panel }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                        <StatusChip T={T} tone={score >= 85 ? "good" : score >= 60 ? "warn" : "faint"}>{score}% match</StatusChip>
                        {lead.requester_name} <span className="font-normal" style={{ color: T.sub }}>· {lead.requester_phone}</span>
                        {lead.orders && lead.orders.member_saving_cents > 0 && <StatusChip T={T} tone="accent">Stitched+</StatusChip>}
                        {lead.orders && <StatusChip T={T} tone="warn">{rand(lead.orders.total_cents)}</StatusChip>}
                      </div>
                      {lead.details && <div className="mt-0.5 text-[11px]" style={{ color: T.sub }}>{lead.details}</div>}
                      <div className="mt-0.5 text-[10px]" style={{ color: T.faint }}>{lead.ref}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button onClick={() => setOpenLeadThreadId(openLeadThreadId === lead.id ? null : lead.id)} className="press flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={btnG}>
                        <MessageCircle size={11} />Message
                      </button>
                      <button onClick={() => handleRespond(lead.ref, "accept")} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={btnA}>Accept</button>
                      <button onClick={() => handleRespond(lead.ref, "decline")} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={btnG}>Decline</button>
                    </div>
                  </div>
                  {openLeadThreadId === lead.id && (
                    <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: T.border }}>
                      <LeadThreadPanel T={T} leadRef={lead.ref} withSession />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </PortalCard>
      )}

      {/* MAIN + SIDEBAR — the business (earnings, quotes, bookings) gets the
          wide column; growth + calendar sit alongside in a narrower one, so
          nothing has to fight the whole page width just to be readable. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {/* WEEKLY EARNINGS */}
          <PortalCard T={T}>
            <div className="mb-3 text-sm font-bold">Weekly earnings</div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer>
                <BarChart data={weeklyEarnings} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: T.faint, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: rgba(T.accent, 0.08) }}
                    formatter={(v) => rand(Number(v))}
                    contentStyle={{ background: T.tipBg, border: `1px solid ${T.border}`, borderRadius: 10, color: T.ink, fontSize: 12 }}
                  />
                  <Bar dataKey="totalCents" name="Earnings" radius={[6, 6, 0, 0]} fill={T.accent} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PortalCard>

          {/* QUOTES — one booking at a time: pick which booking from the
              dropdown (this is the "view different quotes" a supplier
              couldn't do before), see its quote history, and create or
              revise a quote right there. */}
          <PortalCard T={T}>
            <div className="text-sm font-bold">Quotes</div>
            <div className="mt-0.5 text-xs" style={{ color: T.faint }}>Pick a booking to see its quote, send a first one, or revise it while the client hasn't responded yet.</div>

            {quoteBoard.length === 0 && <div className="mt-2.5 text-xs" style={{ color: T.faint }}>No bookings yet — a quote can be sent once a client requests you.</div>}

            {quoteBoard.length > 0 && (
              <>
                <select value={quoteTicketRef} onChange={(e) => setQuoteTicketRef(e.target.value)} className="mt-2.5 w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}>
                  {quoteBoard.map((r) => (
                    <option key={r.ticketRef} value={r.ticketRef}>
                      {r.ticketRef} · {r.eventLabel} · {r.ticketStatus}{r.quote ? ` · quote ${r.quote.status.replace("_", " ")}` : " · needs a quote"}
                    </option>
                  ))}
                </select>

                {selectedQuoteRow && (() => {
                  const q = selectedQuoteRow.quote;
                  const versions = q ? [...q.quote_versions].sort((a, b) => a.version - b.version) : [];
                  const viewed = versions.find((v) => v.version === (viewVersion ?? q?.current_version)) ?? versions[versions.length - 1];
                  const canEdit = !q || q.status === "sent" || q.status === "change_requested";
                  const showForm = !q || editingQuote;

                  return (
                    <div className="mt-2.5">
                      {q && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-bold">
                            {q.ref} <span className="font-normal" style={{ color: T.sub }}>· v{q.current_version}{viewed ? ` · ${rand(viewed.total_cents)}` : ""}</span>
                          </div>
                          <StatusChip T={T} tone={q.status === "accepted" ? "good" : q.status === "declined" ? "bad" : q.status === "change_requested" ? "warn" : "accent"}>{q.status.replace("_", " ")}</StatusChip>
                        </div>
                      )}

                      {versions.length > 1 && (
                        <select
                          value={viewed?.version ?? ""}
                          onChange={(e) => setViewVersion(Number(e.target.value))}
                          className="mt-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold outline-none"
                          style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}
                        >
                          {versions.map((v) => <option key={v.version} value={v.version}>Version {v.version} · {rand(v.total_cents)}</option>)}
                        </select>
                      )}

                      {viewed && (
                        <div className="mt-2 space-y-1 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                          {viewed.quote_items.map((it, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span style={{ color: T.sub }}>{it.label} × {it.qty}</span>
                              <span className="tnum font-bold">{rand(it.line_total_cents)}</span>
                            </div>
                          ))}
                          {viewed.note && <div className="mt-1 text-xs" style={{ color: T.faint }}>Note: {viewed.note}</div>}
                        </div>
                      )}

                      {q && canEdit && !editingQuote && (
                        <button onClick={startEditQuote} className="press mt-2 rounded-lg px-3 py-1.5 text-[11px] font-bold" style={btnG}>
                          Edit &amp; send revision
                        </button>
                      )}
                      {q && !canEdit && (
                        <div className="mt-2 text-[11px]" style={{ color: T.faint }}>
                          This quote is {q.status} — {q.status === "accepted" ? "locked in, no further changes." : "you can't revise a declined quote."}
                        </div>
                      )}

                      {showForm && (
                        <form onSubmit={submitQuote} className="mt-2.5 space-y-1.5 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                          {quoteDraftItems.length > 0 && (
                            <div className="space-y-1">
                              {quoteDraftItems.map((it, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs" style={{ background: T.panel2 }}>
                                  <span>{it.label} × {it.qty}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="tnum font-bold">{rand(it.qty * it.unit_price_cents)}</span>
                                    <button type="button" onClick={() => removeQuoteDraftItem(i)} aria-label="Remove" style={{ color: T.faint }}><X size={12} /></button>
                                  </div>
                                </div>
                              ))}
                              <div className="text-right text-xs font-bold">Total: {rand(quoteDraftItems.reduce((s, it) => s + it.qty * it.unit_price_cents, 0))}</div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1.5">
                            <input value={quoteItemLabel} onChange={(e) => setQuoteItemLabel(e.target.value)} placeholder="Line item, e.g. DJ + sound setup" className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }} />
                            <input value={quoteItemQty} onChange={(e) => setQuoteItemQty(e.target.value)} type="number" min={1} placeholder="Qty" className="w-16 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }} />
                            <input value={quoteItemPrice} onChange={(e) => setQuoteItemPrice(e.target.value)} type="number" min={0} placeholder="Price (R)" className="w-24 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }} />
                            <button type="button" onClick={addQuoteDraftItem} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={btnG}><Plus size={11} />Add line</button>
                          </div>
                          <div className="flex gap-1.5">
                            <button type="submit" disabled={sendingQuote || quoteDraftItems.length === 0} className="press rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
                              {sendingQuote ? "Sending…" : q ? `Send revision (v${q.current_version + 1})` : "Send quote"}
                            </button>
                            {q && (
                              <button type="button" onClick={() => { setEditingQuote(false); setQuoteDraftItems([]); }} className="press rounded-lg px-3 py-1.5 text-[11px] font-bold" style={btnG}>
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </PortalCard>

          {/* REVENUE OPPORTUNITY */}
          {revenueOpportunity.rows.length > 0 && (
            <PortalCard T={T} style={{ borderColor: rgba(T.gold, 0.4), background: rgba(T.gold, 0.06) }}>
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.gold, letterSpacing: 1 }}><TrendingUp size={12} />REVENUE OPPORTUNITY</div>
              <div className="mt-0.5 text-xs" style={{ color: T.sub }}>Pipeline value still in play across quotes awaiting a response.</div>
              <div className="mt-2.5 space-y-1.5">
                {revenueOpportunity.rows.map(([label, cents]) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: rgba(T.gold, 0.15) }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, (cents / revenueOpportunity.total) * 100)}%`, background: T.gold }} />
                    </div>
                    <span className="tnum shrink-0 font-bold" style={{ width: 72, textAlign: "right" }}>{rand(cents)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t pt-2" style={{ borderColor: rgba(T.gold, 0.25) }}>
                <span className="text-xs font-bold" style={{ color: T.gold, letterSpacing: 1 }}>TOTAL OPPORTUNITY</span>
                <span className="tnum text-lg font-bold" style={{ color: T.gold }}>{rand(revenueOpportunity.total)}</span>
              </div>
            </PortalCard>
          )}

          {/* BOOKINGS — dated tickets (conflict-checked) and upcoming/past,
              merged into one card since they're the same real bookings
              viewed two ways; showing them separately was pure repetition. */}
          <PortalCard T={T}>
            <div className="flex items-center gap-1.5 text-sm font-bold"><Calendar size={14} style={{ color: T.gold }} />Bookings</div>
            {sortedDates.length === 0 && <div className="mt-2 text-xs" style={{ color: T.faint }}>No dated bookings yet — they appear here once a client's event has a date set.</div>}

            {nextWeekCount > 0 && (
              <div className="mt-2.5 rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>
                {nextWeekCount} event{nextWeekCount > 1 ? "s" : ""} in the next 7 days
              </div>
            )}

            <div className="mt-2.5 space-y-2">
              {sortedDates.map((d) => {
                const dayTickets = datedByDate.get(d)!;
                const conflict = dayTickets.length > 1;
                const confirmedHere = dayTickets.find((t) => t.status === "confirmed");
                const days = confirmedHere ? daysUntil(d) : null;
                const isPast = days !== null && days < 0;
                return (
                  <div
                    key={d}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5"
                    style={conflict ? { borderColor: rgba(T.bad, 0.4), background: rgba(T.bad, 0.06) } : { borderColor: T.border, opacity: isPast ? 0.7 : 1 }}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold">
                        {new Date(`${d}T00:00:00`).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <div className="mt-0.5 text-[11px]" style={{ color: T.sub }}>
                        {dayTickets.map((t) => `${t.events?.type ?? "Event"} · ${t.ref} (${t.status})`).join(" · ")}
                      </div>
                    </div>
                    {conflict ? (
                      <StatusChip T={T} tone="bad"><AlertTriangle size={10} />{dayTickets.length} events same day</StatusChip>
                    ) : days !== null && (
                      <StatusChip T={T} tone={isPast ? "faint" : days <= 7 ? "bad" : days <= 30 ? "warn" : "good"}>{isPast ? "Done" : days === 0 ? "Today" : `${days}d away`}</StatusChip>
                    )}
                  </div>
                );
              })}
            </div>
          </PortalCard>

          {/* ORDERS */}
          <PortalCard T={T}>
            <div className="text-sm font-bold">Your orders</div>
            {orderGroups.length === 0 && <div className="mt-2 text-xs" style={{ color: T.faint }}>No bookings yet — paid bookings will show up here automatically.</div>}
            <div className="mt-2.5 space-y-2">
              {orderGroups.map((g) => (
                <div key={g.order.id} className="rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 text-xs font-bold">
                      {g.order.customer_name} <span className="font-normal" style={{ color: T.sub }}>· {g.order.customer_phone}</span>
                      {g.order.occasion && <span className="font-normal" style={{ color: T.sub }}> · {g.order.occasion}</span>}
                      {g.order.hire_date && <span className="font-normal" style={{ color: T.sub }}> · {g.order.hire_date}</span>}
                      <div className="mt-0.5 text-[10px] font-normal" style={{ color: T.faint }}>{g.order.ref}</div>
                    </div>
                    <StatusChip T={T} tone={g.order.status === "paid" ? "good" : "warn"}>{g.order.status === "paid" ? "Paid" : g.order.status.replace("_", " ")}</StatusChip>
                  </div>
                  <div className="mt-2 space-y-1">
                    {g.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between text-xs" style={{ color: T.sub }}>
                        <span>{it.label} × {it.qty}</span>
                        <span className="tnum">{rand(it.line_total_cents)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PortalCard>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-3">
          {/* STITCHED+ */}
          <PortalCard T={T} style={{ borderColor: rgba(T.accent, 0.35), background: rgba(T.accent, 0.06) }}>
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.accent, letterSpacing: 1 }}><TrendingUp size={12} />STITCHED+ BRINGS YOU DEMAND</div>
            <div className="mt-1.5 text-sm" style={{ color: T.ink }}><b>{stats.memberSharePct}%</b> of your paid orders come from Stitched+ members — they book more and cancel less.</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.1) }}>
              <div className="h-full rounded-full" style={{ width: `${stats.memberSharePct}%`, background: T.accent }} />
            </div>
          </PortalCard>

          {/* BOOST */}
          <PortalCard T={T}>
            <div className="text-sm font-bold">Grow your visibility</div>
            <div className="mt-1 text-xs" style={{ color: T.sub }}>{leads.length} total lead{leads.length === 1 ? "" : "s"} via Stitchd so far.</div>
            <button onClick={handleBoost} disabled={boosting} className="press mt-2.5 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60" style={btnDark}>
              {boosting ? "Redirecting to checkout…" : "Boost for R350/week"}
            </button>
          </PortalCard>

          {/* CALENDAR / CAPACITY — compact: this lives in the narrow column
              on purpose (a supplier cares about "is anything blocked/promo
              this month", not staring at a full-width grid), and a one-line
              summary makes that answer legible before you even scan it. */}
          <PortalCard T={T}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-sm font-bold"><Calendar size={14} style={{ color: T.gold }} />Calendar</div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCalendarMonth((m) => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n; })} className="press rounded-lg p-1" style={btnG}><ChevronLeft size={12} /></button>
                <button onClick={() => setCalendarMonth((m) => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n; })} className="press rounded-lg p-1" style={btnG}><ChevronRight size={12} /></button>
              </div>
            </div>
            <div className="text-xs font-bold" style={{ color: T.sub }}>{calendarMonth.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</div>
            <div className="mt-1.5 text-[11px]" style={{ color: T.faint }}>
              {calendarMonthSummary.booked + calendarMonthSummary.blocked + calendarMonthSummary.promo === 0
                ? "Nothing blocked or promoted this month."
                : `${calendarMonthSummary.booked} booked · ${calendarMonthSummary.blocked} blocked · ${calendarMonthSummary.promo} promo`}
            </div>
            {(() => {
              const year = calendarMonth.getFullYear();
              const month = calendarMonth.getMonth();
              const firstDay = new Date(year, month, 1);
              const startOffset = (firstDay.getDay() + 6) % 7; // Monday-start
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells: (string | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`)];
              const stateColor: Record<string, string> = { booked: T.bad, tentative: T.warn, blocked: T.faint, promo: T.accent, open: T.good };
              return (
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold" style={{ color: T.faint }}>{d}</div>
                  ))}
                  {cells.map((dateStr, i) => {
                    if (!dateStr) return <div key={i} />;
                    const state = calendarCellState(dateStr);
                    const editable = state === "open" || state === "blocked" || state === "promo";
                    const day = Number(dateStr.slice(-2));
                    return (
                      <button
                        key={dateStr}
                        disabled={!editable}
                        onClick={() => cycleAvailability(dateStr)}
                        className="press flex aspect-square items-center justify-center rounded-md text-[10px] font-bold disabled:cursor-not-allowed"
                        style={{ background: rgba(stateColor[state], state === "open" ? 0.08 : 0.22), color: state === "open" ? T.ink : stateColor[state], border: `1px solid ${rgba(stateColor[state], 0.3)}` }}
                        title={state}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
            <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-1 text-[9px]" style={{ color: T.sub }}>
              {([["booked", T.bad], ["tentative", T.warn], ["blocked", T.faint], ["promo", T.accent], ["open", T.good]] as [string, string][]).map(([label, c]) => (
                <span key={label} className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{label}</span>
              ))}
            </div>
            <div className="mt-2 text-[10px]" style={{ color: T.faint }}>Tap an open date to block it or mark a promo.</div>
          </PortalCard>
        </div>
      </div>

      {/* LISTING MANAGEMENT — the lower-priority admin/utility actions,
          grouped as compact 2×2 cards instead of a long single-column
          stack; each one is a quick glance + one action, not a scroll stop. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* ADD-ONS */}
        <PortalCard T={T}>
          <div className="text-sm font-bold">Package add-ons</div>
          <div className="mt-1 text-xs" style={{ color: T.sub }}>Suppliers who offer add-ons earn bigger baskets.</div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {addons.map((a) => (
              <span key={a.id} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: T.panel2, color: T.ink }}>
                {a.label} <span style={{ color: T.sub }}>{rand(a.price_cents)}</span>
                <button onClick={() => removeAddon(a.id)} aria-label={`Remove ${a.label}`} style={{ color: T.faint }}><X size={12} /></button>
              </span>
            ))}
            {addons.length === 0 && <span className="text-xs" style={{ color: T.faint }}>None yet</span>}
          </div>
          <form onSubmit={addAddon} className="mt-2.5 flex flex-wrap gap-1.5">
            <input value={addonLabel} onChange={(e) => setAddonLabel(e.target.value)} placeholder="Add-on name, e.g. Extra hour" className="min-w-0 flex-1 rounded-lg px-3 py-2 text-xs outline-none" style={inputS} />
            <input value={addonPrice} onChange={(e) => setAddonPrice(e.target.value)} placeholder="Price (R)" inputMode="decimal" className="w-28 rounded-lg px-3 py-2 text-xs outline-none" style={inputS} />
            <button type="submit" disabled={addonSubmitting || !addonLabel.trim() || !addonPrice.trim()} className="press flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60" style={btnA}>
              <Plus size={12} />{addonSubmitting ? "Adding…" : "Add"}
            </button>
          </form>
        </PortalCard>

        {/* VERIFIED BADGE */}
        <PortalCard T={T}>
          <div className="flex items-center gap-1.5 text-sm font-bold"><BadgeCheck size={15} style={{ color: T.info }} />Verified badge</div>
          <div className="mt-1 text-xs" style={{ color: T.sub }}>Verified suppliers convert better — clients trust the tick. Free; we check your docs &amp; reviews.</div>
          <div className="mt-2.5">
            {supplier.verified ? (
              <StatusChip T={T} tone="good"><ShieldCheck size={10} />Verified</StatusChip>
            ) : verification?.status === "pending" ? (
              <StatusChip T={T} tone="warn">Request pending — we'll be in touch</StatusChip>
            ) : (
              <button onClick={requestVerification} disabled={requestingVerification} className="press rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-60" style={btnDark}>
                {requestingVerification ? "Requesting…" : "Request verification — free"}
              </button>
            )}
          </div>
        </PortalCard>

        {/* PROMOTIONS */}
        <PortalCard T={T}>
          <div className="text-sm font-bold">Promotions</div>
          <div className="mt-0.5 text-xs" style={{ color: T.faint }}>Publish a deal for a low-demand date — it appears in the client marketplace immediately.</div>

          <form onSubmit={publishPromotion} className="mt-2.5 space-y-1.5 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
            <div className="flex flex-wrap gap-1.5">
              <input value={newPromoTitle} onChange={(e) => setNewPromoTitle(e.target.value)} placeholder="Deal title, e.g. Friday off-peak special" className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }} />
              <input value={newPromoDiscount} onChange={(e) => setNewPromoDiscount(e.target.value)} placeholder="Discount, e.g. 15% off" className="w-32 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }} />
              <input value={newPromoDate} onChange={(e) => setNewPromoDate(e.target.value)} type="date" className="rounded-lg px-2.5 py-1.5 text-xs outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }} />
            </div>
            <textarea value={newPromoDescription} onChange={(e) => setNewPromoDescription(e.target.value)} placeholder="A line or two about the deal…" className="w-full rounded-lg px-2.5 py-2 text-xs outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}`, minHeight: 50 }} />
            <button type="submit" disabled={creatingPromo || !newPromoTitle.trim()} className="press rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
              {creatingPromo ? "Publishing…" : "Publish deal"}
            </button>
          </form>

          <div className="mt-2.5 space-y-2">
            {promotions.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                <div className="min-w-0">
                  <div className="text-xs font-bold">{p.title} {p.discount_label && <span style={{ color: T.gold }}>· {p.discount_label}</span>}</div>
                  {p.description && <div className="mt-0.5 text-[11px]" style={{ color: T.sub }}>{p.description}</div>}
                  {p.applicable_date && <div className="mt-0.5 text-[10px]" style={{ color: T.faint }}>{new Date(`${p.applicable_date}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</div>}
                </div>
                <button onClick={() => togglePromotionStatus(p)} className="press shrink-0">
                  <StatusChip T={T} tone={p.status === "published" ? "good" : "faint"}>{p.status}</StatusChip>
                </button>
              </div>
            ))}
            {promotions.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No promotions published yet.</div>}
          </div>
        </PortalCard>

        {/* SUPPORT TICKETS */}
        <PortalCard T={T}>
          <div className="flex items-center gap-1.5 text-sm font-bold"><LifeBuoy size={14} style={{ color: T.gold }} />Support tickets</div>
          <div className="mt-0.5 text-xs" style={{ color: T.faint }}>Payment issues, disputes, platform problems — raised here go straight to ops.</div>

          <form onSubmit={createSupportTicket} className="mt-2.5 space-y-1.5 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
            <select value={newTicketEventId} onChange={(e) => setNewTicketEventId(e.target.value)} className="w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}>
              <option value="">General — not tied to a specific booking</option>
              {supportTicketEventOptions.map(([eventId, label]) => <option key={eventId} value={eventId}>{label}</option>)}
            </select>
            <div className="flex flex-wrap gap-1.5">
              <select value={newTicketCategory} onChange={(e) => setNewTicketCategory(e.target.value as typeof newTicketCategory)} className="rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}>
                {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
              <select value={newTicketPriority} onChange={(e) => setNewTicketPriority(e.target.value as typeof newTicketPriority)} className="rounded-lg px-2 py-1.5 text-[11px] font-semibold outline-none" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}>
                {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <textarea
              value={newTicketBody}
              onChange={(e) => setNewTicketBody(e.target.value)}
              placeholder="Describe the issue…"
              className="w-full rounded-lg px-2.5 py-2 text-xs outline-none"
              style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}`, minHeight: 56 }}
            />
            <button type="submit" disabled={creatingSupportTicket || !newTicketBody.trim()} className="press rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
              {creatingSupportTicket ? "Raising…" : "Raise ticket"}
            </button>
          </form>

          <div className="mt-2.5 space-y-2">
            {supportTickets.map((t) => (
              <div key={t.id} className="rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                <button onClick={() => setOpenSupportId(openSupportId === t.id ? null : t.id)} className="press flex w-full flex-wrap items-center justify-between gap-2 text-left">
                  <div className="min-w-0 text-xs font-bold">
                    {t.ref} <span className="font-normal" style={{ color: T.sub }}>· {t.events ? `${t.events.type}${t.events.event_date ? " " + new Date(`${t.events.event_date}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : ""}` : "general"} · {t.category.replace("_", " ")} · {t.priority}</span>
                  </div>
                  <StatusChip T={T} tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_LABEL[t.status]}</StatusChip>
                </button>
                {openSupportId === t.id && (
                  <TicketV2Card T={T} ticketId={t.id} ticketRef={t.ref} status={t.status} viewerRole="supplier" onChanged={() => setOpenSupportId(t.id)} />
                )}
              </div>
            ))}
            {supportTickets.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No support tickets raised.</div>}
          </div>
        </PortalCard>
      </div>

      <ConfirmDialog
        T={T}
        open={switchDialogOpen}
        title="Switch listing?"
        message={`This releases "${supplier.name}" back to unclaimed — you'll pick a different listing (or claim this one again) next.`}
        confirmLabel="Release & switch"
        danger
        onConfirm={confirmSwitchBusiness}
        onCancel={() => setSwitchDialogOpen(false)}
      />
    </PortalShell>
  );
}
