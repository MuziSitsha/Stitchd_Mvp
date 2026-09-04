import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { ShieldCheck, ShieldOff, AlertTriangle, MessageCircle, Sparkles, Ban, Search, History, LifeBuoy, Percent, Receipt, Send } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { supabase } from "../lib/supabase";
import { adminToggleBoost, adminSuspendSupplier, unpublishPromotion, refundOrder } from "../lib/functions";
import { computeWeeklyEarnings, type OrderItemRow } from "../lib/supplierStats";
import { PortalShell, PortalCard, StatTile, StatusChip, ConfirmDialog } from "../components/PortalShell";
import { TicketThread } from "../components/proto/TicketThread";
import { LeadThreadPanel } from "../components/proto/LeadThreadPanel";
import { TicketV2Card, TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from "../components/proto/TicketV2Card";

interface AdminSupplier {
  id: string;
  name: string;
  category: string;
  status: string;
  verified: boolean;
}

interface AdminLead {
  id: string;
  ref: string;
  requester_name: string;
  requester_phone: string;
  status: "new" | "accepted" | "declined";
  created_at: string;
  suppliers: { name: string; category: string } | null;
}

interface AdminTicket {
  id: string;
  ref: string;
  status: "pending" | "confirmed";
  created_at: string;
  suppliers: { name: string; category: string } | null;
}

interface RawTicketMessage {
  id: string;
  ticket_id: string;
  created_at: string;
  supplier_tickets: { ref: string; suppliers: { name: string } | null } | null;
}

interface TicketConvo {
  ticketId: string;
  ref: string;
  supplierName: string;
  count: number;
  lastAt: string;
}

interface SlaTicket {
  id: string;
  ref: string;
  status: "pending" | "confirmed" | "declined";
  created_at: string;
  suppliers: { name: string; category: string } | null;
}

interface AdminDatedTicket {
  id: string;
  ref: string;
  status: "pending" | "confirmed";
  supplier_id: string;
  suppliers: { name: string } | null;
  events: { event_date: string | null } | null;
}

interface AdminPromotion {
  id: string;
  ref: string;
  title: string;
  discount_label: string | null;
  applicable_date: string | null;
  status: "draft" | "published" | "unpublished";
  created_at: string;
  suppliers: { name: string } | null;
}

interface SupportTicket {
  id: string;
  ref: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  suppliers: { name: string } | null;
  events: { event_date: string | null; type: string } | null;
}

interface AdminQuoteVersion {
  version: number;
  total_cents: number;
  note: string | null;
  quote_items: { label: string; qty: number; unit_price_cents: number; line_total_cents: number }[];
}

interface AdminQuote {
  id: string;
  ref: string;
  status: string;
  current_version: number;
  created_at: string;
  supplier_tickets: { ref: string; suppliers: { name: string } | null } | null;
  quote_versions: AdminQuoteVersion[];
}

interface AdminOrder {
  id: string;
  ref: string;
  customer_name: string;
  customer_phone: string;
  total_cents: number;
  status: "draft" | "pending_payment" | "paid" | "failed" | "refunded";
  created_at: string;
}

interface MessageLogRow {
  id: string;
  ref: string;
  channel: "whatsapp" | "sms";
  template: string;
  to_phone: string | null;
  status: "sent" | "logged" | "failed";
  provider: string;
  payload: { message?: string; reason?: string };
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  provider: string;
  event_type: string | null;
  reference: string | null;
  status: "received" | "processed" | "failed" | "invalid_signature";
  error_message: string | null;
  created_at: string;
}

interface AuditRow {
  id: string;
  ref: string;
  entity_type: string;
  entity_id: string | null;
  actor_id: string | null;
  actor_role: string | null;
  from_state: string | null;
  to_state: string | null;
  event: string;
  payload: Record<string, unknown>;
  at: string;
}

// FR-ADMIN-01/02: a live cross-supplier lead board, and verify/feature
// toggles. Both are read/write against real tables/functions that already
// existed with zero UI — this page is the first face on them.
export function AdminConsole() {
  const { T } = useTheme();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [datedTickets, setDatedTickets] = useState<AdminDatedTicket[]>([]);
  const [allTickets, setAllTickets] = useState<SlaTicket[]>([]);
  const [gmvItems, setGmvItems] = useState<OrderItemRow[]>([]);
  const [ticketMessages, setTicketMessages] = useState<RawTicketMessage[]>([]);
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>("all");
  const [traceInput, setTraceInput] = useState("");
  const [traceRows, setTraceRows] = useState<AuditRow[] | null>(null);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [tracing, setTracing] = useState(false);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportFilter, setSupportFilter] = useState<string>("active");
  const [quotes, setQuotes] = useState<AdminQuote[]>([]);
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const [messageLog, setMessageLog] = useState<MessageLogRow[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [refundingRef, setRefundingRef] = useState<string | null>(null);
  const [refundDialogRef, setRefundDialogRef] = useState<string | null>(null);
  const [openSupportId, setOpenSupportId] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [openLeadThreadId, setOpenLeadThreadId] = useState<string | null>(null);
  const [openTicketConvoId, setOpenTicketConvoId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadSuppliers = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("suppliers")
      .select("id, name, category, status, verified")
      .order("category");
    if (fetchError) setError(fetchError.message);
    else setSuppliers(data ?? []);
  }, []);

  const loadAudit = useCallback(async (entityType: string) => {
    let query = supabase.from("activity_log").select("*").order("at", { ascending: false }).limit(50);
    if (entityType !== "all") query = query.eq("entity_type", entityType);
    const { data, error: fetchError } = await query;
    if (fetchError) setError(fetchError.message);
    else setAuditRows((data as unknown as AuditRow[]) ?? []);
  }, []);

  async function traceRef() {
    const ref = traceInput.trim();
    if (!ref) return;
    setTracing(true);
    setTraceError(null);
    setTraceRows(null);
    const { data, error: fetchError } = await supabase
      .from("activity_log")
      .select("*")
      .eq("ref", ref)
      .order("at", { ascending: true });
    if (fetchError) setTraceError(fetchError.message);
    else if (!data || data.length === 0) setTraceError(`No activity found for ref "${ref}".`);
    else setTraceRows(data as unknown as AuditRow[]);
    setTracing(false);
  }

  const loadPromotions = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("promotions")
      .select("id, ref, title, discount_label, applicable_date, status, created_at, suppliers(name)")
      .order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    else setPromotions((data as unknown as AdminPromotion[]) ?? []);
  }, []);

  async function moderatePromotion(ref: string) {
    setBusyId(ref);
    setError(null);
    try {
      await unpublishPromotion(ref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish promotion");
    } finally {
      setBusyId(null);
    }
  }

  const loadSupportTickets = useCallback(async (filter: string) => {
    let query = supabase
      .from("tickets")
      .select("id, ref, category, priority, status, created_at, suppliers(name), events(event_date, type)")
      .order("created_at", { ascending: false });
    if (filter === "active") query = query.not("status", "in", "(closed,resolved)");
    else if (filter !== "all") query = query.eq("status", filter);
    const { data, error: fetchError } = await query;
    if (fetchError) setError(fetchError.message);
    else setSupportTickets((data as unknown as SupportTicket[]) ?? []);
  }, []);

  const loadQuotes = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("quotes")
      .select("id, ref, status, current_version, created_at, supplier_tickets(ref, suppliers(name)), quote_versions(version, total_cents, note, quote_items(label, qty, unit_price_cents, line_total_cents))")
      .order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    else setQuotes((data as unknown as AdminQuote[]) ?? []);
  }, []);

  const loadOrders = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("orders")
      .select("id, ref, customer_name, customer_phone, total_cents, status, created_at")
      .in("status", ["paid", "refunded"])
      .order("created_at", { ascending: false })
      .limit(30);
    if (fetchError) setError(fetchError.message);
    else setOrders((data as unknown as AdminOrder[]) ?? []);
  }, []);

  async function confirmRefund(reason?: string) {
    const ref = refundDialogRef;
    setRefundDialogRef(null);
    if (!ref || !reason?.trim()) return;
    setRefundingRef(ref);
    setError(null);
    try {
      await refundOrder(ref, reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refund this order");
    } finally {
      setRefundingRef(null);
    }
  }

  const loadMessageLog = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("message_log")
      .select("id, ref, channel, template, to_phone, status, provider, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (fetchError) setError(fetchError.message);
    else setMessageLog((data as unknown as MessageLogRow[]) ?? []);
  }, []);

  const loadWebhookDeliveries = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("webhook_deliveries")
      .select("id, provider, event_type, reference, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (fetchError) setError(fetchError.message);
    else setWebhookDeliveries((data as unknown as WebhookDelivery[]) ?? []);
  }, []);

  const loadFeatured = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("boosts")
      .select("supplier_id")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());
    if (fetchError) setError(fetchError.message);
    else setFeaturedIds(new Set((data ?? []).map((b) => b.supplier_id)));
  }, []);

  const loadLeads = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("leads")
      .select("id, ref, requester_name, requester_phone, status, created_at, suppliers(name, category)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (fetchError) setError(fetchError.message);
    else setLeads((data as unknown as AdminLead[]) ?? []);
  }, []);

  const loadTickets = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("supplier_tickets")
      .select("id, ref, status, created_at, suppliers(name, category)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    else setTickets((data as unknown as AdminTicket[]) ?? []);
  }, []);

  const loadTicketMessages = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("ticket_messages")
      .select("id, ticket_id, created_at, supplier_tickets(ref, suppliers(name))")
      .order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    else setTicketMessages((data as unknown as RawTicketMessage[]) ?? []);
  }, []);

  const loadGmvItems = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("order_items")
      .select("id, label, qty, line_total_cents, orders(id, ref, status, customer_name, customer_phone, occasion, hire_date, created_at, member_saving_cents)");
    if (fetchError) setError(fetchError.message);
    else setGmvItems((data as unknown as OrderItemRow[]) ?? []);
  }, []);

  const loadAllTickets = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("supplier_tickets")
      .select("id, ref, status, created_at, suppliers(name, category)")
      .order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    else setAllTickets((data as unknown as SlaTicket[]) ?? []);
  }, []);

  const loadDatedTickets = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("supplier_tickets")
      .select("id, ref, status, supplier_id, suppliers(name), events(event_date)")
      .in("status", ["pending", "confirmed"]);
    if (fetchError) setError(fetchError.message);
    else setDatedTickets((data as unknown as AdminDatedTicket[]) ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkAccess() {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        navigate("/admin/login");
        return;
      }
      const { data: roles, error: roleErr } = await supabase
        .from("role_assignments")
        .select("role")
        .eq("user_id", userRes.user.id)
        .eq("status", "active")
        .in("role", ["admin", "super"]);
      if (cancelled) return;
      if (roleErr) {
        setError(roleErr.message);
        setAuthorized(false);
        return;
      }
      setAuthorized((roles ?? []).length > 0);
    }
    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;
    loadSuppliers();
    loadLeads();
    loadTickets();
    loadDatedTickets();
    loadAllTickets();
    loadGmvItems();
    loadTicketMessages();
    loadFeatured();
    loadWebhookDeliveries();
    loadPromotions();
    loadQuotes();
    loadMessageLog();
    loadOrders();

    const channel = supabase
      .channel("admin-console")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, loadLeads)
      .on("postgres_changes", { event: "*", schema: "public", table: "suppliers" }, loadSuppliers)
      .on("postgres_changes", { event: "*", schema: "public", table: "supplier_tickets" }, () => { loadTickets(); loadDatedTickets(); loadAllTickets(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, loadGmvItems)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_messages" }, loadTicketMessages)
      .on("postgres_changes", { event: "*", schema: "public", table: "boosts" }, loadFeatured)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_log" }, () => loadAudit(auditFilter))
      .on("postgres_changes", { event: "*", schema: "public", table: "webhook_deliveries" }, loadWebhookDeliveries)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => loadSupportTickets(supportFilter))
      .on("postgres_changes", { event: "*", schema: "public", table: "promotions" }, loadPromotions)
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, loadQuotes)
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_versions" }, loadQuotes)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_log" }, loadMessageLog)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authorized, loadSuppliers, loadLeads, loadTickets, loadDatedTickets, loadAllTickets, loadGmvItems, loadTicketMessages, loadFeatured, loadAudit, auditFilter, loadWebhookDeliveries, loadSupportTickets, supportFilter, loadPromotions, loadQuotes, loadMessageLog, loadOrders]);

  useEffect(() => {
    if (!authorized) return;
    loadAudit(auditFilter);
  }, [authorized, auditFilter, loadAudit]);

  useEffect(() => {
    if (!authorized) return;
    loadSupportTickets(supportFilter);
  }, [authorized, supportFilter, loadSupportTickets]);

  async function setVerification(supplierId: string, decision: "verified" | "rejected") {
    setBusyId(supplierId);
    setError(null);
    const { error: fnError } = await supabase.functions.invoke("verifications-toggle", {
      body: { supplier_id: supplierId, decision },
    });
    if (fnError) setError(fnError.message);
    setBusyId(null);
  }

  async function toggleFeatured(supplierId: string) {
    setBusyId(supplierId);
    setError(null);
    try {
      await adminToggleBoost(supplierId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle featured status");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSuspend(supplierId: string, suspend: boolean) {
    setBusyId(supplierId);
    setError(null);
    try {
      await adminSuspendSupplier(supplierId, suspend);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update supplier status");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmTicket(ticketRef: string) {
    setBusyId(ticketRef);
    setError(null);
    const { error: fnError } = await supabase.functions.invoke("supplier-tickets-confirm", {
      body: { ticket_ref: ticketRef },
    });
    if (fnError) setError(fnError.message);
    setBusyId(null);
  }

  async function declineTicket(ticketRef: string) {
    setBusyId(ticketRef);
    setError(null);
    const { error: fnError } = await supabase.functions.invoke("supplier-tickets-confirm", {
      body: { ticket_ref: ticketRef, decision: "decline" },
    });
    if (fnError) setError(fnError.message);
    setBusyId(null);
  }

  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };

  // Same per-supplier collision logic as SupplierPortal.tsx's "Your dates",
  // run across every supplier — two of the SAME supplier's tickets sharing a
  // date is the real double-booking risk (two different suppliers sharing a
  // date is completely normal and not flagged).
  const doubleBookings = useMemo(() => {
    const bySupplierDate = new Map<string, AdminDatedTicket[]>();
    for (const t of datedTickets) {
      const d = t.events?.event_date;
      if (!d) continue;
      const key = `${t.supplier_id}::${d}`;
      bySupplierDate.set(key, [...(bySupplierDate.get(key) ?? []), t]);
    }
    return [...bySupplierDate.entries()]
      .filter(([, group]) => group.length > 1)
      .map(([key, group]) => ({ date: key.split("::")[1], tickets: group }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [datedTickets]);

  // Fully computed from status/created_at, no schema change — Open (pending,
  // under the 4-day window), Overdue (pending, at or past it — the window
  // you named), Closed (confirmed or declined either way).
  const sla = useMemo(() => {
    const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const open: SlaTicket[] = [];
    const overdue: SlaTicket[] = [];
    let closed = 0;
    for (const t of allTickets) {
      if (t.status !== "pending") { closed += 1; continue; }
      const ageMs = now - new Date(t.created_at).getTime();
      (ageMs >= FOUR_DAYS_MS ? overdue : open).push(t);
    }
    overdue.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { open, overdue, closed };
  }, [allTickets]);

  const weeklyGmv = useMemo(() => computeWeeklyEarnings(gmvItems), [gmvItems]);
  const gmvFmt = (cents: number) => `R${Math.round(cents / 100).toLocaleString("en-ZA")}`;

  // Read-only ticket-conversation oversight (Phase 7's accountability
  // requirement) — grouped client-side since there's no "distinct ticket_id"
  // view, same pattern already used for double-booking risk above.
  const ticketConvos = useMemo(() => {
    const byTicket = new Map<string, TicketConvo>();
    for (const m of ticketMessages) {
      const existing = byTicket.get(m.ticket_id);
      if (existing) {
        existing.count += 1;
        if (m.created_at > existing.lastAt) existing.lastAt = m.created_at;
      } else {
        byTicket.set(m.ticket_id, {
          ticketId: m.ticket_id,
          ref: m.supplier_tickets?.ref ?? "unknown ticket",
          supplierName: m.supplier_tickets?.suppliers?.name ?? "unknown supplier",
          count: 1,
          lastAt: m.created_at,
        });
      }
    }
    return [...byTicket.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [ticketMessages]);

  if (authorized === null) {
    return (
      <PortalShell title="Checking access…">
        <PortalCard T={T}><span style={{ color: T.sub }}>Checking access…</span></PortalCard>
      </PortalShell>
    );
  }

  if (!authorized) {
    return (
      <PortalShell title="Not authorised">
        <PortalCard T={T}><span style={{ color: T.sub }}>This account doesn't hold an admin or ops role.</span></PortalCard>
      </PortalShell>
    );
  }

  return (
    <PortalShell eyebrow="Ops / Admin" title="Console">
      {error && (
        <div className="rounded-xl px-3 py-2.5 text-xs font-semibold" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>{error}</div>
      )}

      {doubleBookings.length > 0 && (
        <PortalCard T={T}>
          <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: T.bad }}><AlertTriangle size={14} />Double-booking risk ({doubleBookings.length})</div>
          <div className="mt-2.5 space-y-2">
            {doubleBookings.map(({ date, tickets: group }) => (
              <div key={`${group[0].supplier_id}-${date}`} className="rounded-xl border p-2.5" style={{ borderColor: rgba(T.bad, 0.4), background: rgba(T.bad, 0.06) }}>
                <div className="text-xs font-bold">{group[0].suppliers?.name ?? "unknown supplier"}</div>
                <div className="mt-0.5 text-[11px]" style={{ color: T.sub }}>
                  {new Date(`${date}T00:00:00`).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  {" — "}{group.map((t) => `${t.ref} (${t.status})`).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </PortalCard>
      )}

      <PortalCard T={T}>
        <div className="text-sm font-bold">Ticket SLA</div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          <StatTile T={T} value={sla.open.length} label="Open (< 4 days)" />
          <StatTile T={T} value={sla.overdue.length} label="Overdue (4+ days)" color={sla.overdue.length > 0 ? T.bad : undefined} />
          <StatTile T={T} value={sla.closed} label="Closed" />
        </div>
        {sla.overdue.length > 0 && (
          <div className="mt-2.5 space-y-2">
            {sla.overdue.map((t) => {
              const days = Math.floor((Date.now() - new Date(t.created_at).getTime()) / (24 * 60 * 60 * 1000));
              return (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5" style={{ borderColor: rgba(T.bad, 0.4), background: rgba(T.bad, 0.06) }}>
                  <div className="min-w-0">
                    <div className="text-xs font-bold">{t.suppliers?.name ?? "unknown supplier"} <span className="font-normal" style={{ color: T.sub }}>· {t.suppliers?.category}</span></div>
                    <div className="mt-0.5 text-[10px]" style={{ color: T.faint }}>{t.ref}</div>
                  </div>
                  <StatusChip T={T} tone="bad">{days}d unanswered</StatusChip>
                </div>
              );
            })}
          </div>
        )}
      </PortalCard>

      <PortalCard T={T}>
        <div className="flex items-center gap-1.5 text-sm font-bold"><Search size={14} style={{ color: T.gold }} />Transaction inspector</div>
        <div className="mt-0.5 text-xs" style={{ color: T.faint }}>Paste any ref (ST-SUP-, ST-LEAD-, ST-BKG-, ST-BST-, ST-BPY-…) to trace it across every actor.</div>
        <form onSubmit={(e) => { e.preventDefault(); traceRef(); }} className="mt-2.5 flex gap-2">
          <input
            value={traceInput}
            onChange={(e) => setTraceInput(e.target.value)}
            placeholder="e.g. ST-SUP-00003"
            className="min-w-0 flex-1 rounded-xl px-3 py-2 text-xs outline-none"
            style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}
          />
          <button type="submit" disabled={tracing} className="press rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-60" style={btnA}>
            {tracing ? "Tracing…" : "Trace"}
          </button>
        </form>
        {traceError && <div className="mt-2.5 text-xs font-semibold" style={{ color: T.bad }}>{traceError}</div>}
        {traceRows && (
          <div className="mt-2.5 space-y-2">
            {traceRows.map((r) => (
              <details key={r.id} className="rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                <summary className="cursor-pointer text-xs">
                  <span className="font-bold">{r.entity_type}</span>
                  <span style={{ color: T.sub }}> · {r.from_state ? `${r.from_state} → ${r.to_state}` : r.to_state}</span>
                  <span className="ml-1.5" style={{ color: T.faint }}>{new Date(r.at).toLocaleString()}</span>
                </summary>
                <div className="mt-2 overflow-x-auto rounded-lg p-2" style={{ background: T.panel2 }}>
                  <pre className="text-[10px]" style={{ color: T.sub }}>{JSON.stringify(r.payload, null, 2)}</pre>
                </div>
              </details>
            ))}
          </div>
        )}
      </PortalCard>

      <PortalCard T={T}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-bold"><History size={14} style={{ color: T.gold }} />Audit explorer</div>
          <select
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            className="rounded-lg px-2 py-1 text-[11px] font-semibold outline-none"
            style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}
          >
            {["all", "boosts", "orders", "leads", "supplier_tickets", "verifications", "role_assignments", "budget_payments"].map((t) => (
              <option key={t} value={t}>{t === "all" ? "All entities" : t}</option>
            ))}
          </select>
        </div>
        <div className="mt-2.5 space-y-1.5">
          {auditRows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs" style={{ background: T.panel2 }}>
              <div className="min-w-0">
                <span className="font-bold">{r.entity_type}</span>
                <span style={{ color: T.sub }}> · {r.ref}</span>
                <span style={{ color: T.faint }}> · {r.from_state ? `${r.from_state} → ${r.to_state}` : r.to_state}</span>
              </div>
              <span className="shrink-0" style={{ color: T.faint }}>{new Date(r.at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
          {auditRows.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No activity recorded yet.</div>}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="text-sm font-bold">Integration health</div>
        <div className="mt-0.5 text-xs" style={{ color: T.faint }}>Paystack webhook deliveries — failures and invalid signatures highlighted.</div>
        <div className="mt-2.5 space-y-1.5">
          {webhookDeliveries.map((d) => {
            const bad = d.status === "failed" || d.status === "invalid_signature";
            return (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs"
                style={bad ? { background: rgba(T.bad, 0.08) } : { background: T.panel2 }}
              >
                <div className="min-w-0">
                  <span className="font-bold">{d.event_type ?? "unknown event"}</span>
                  {d.reference && <span style={{ color: T.sub }}> · {d.reference}</span>}
                  {d.error_message && <span style={{ color: bad ? T.bad : T.faint }}> · {d.error_message}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusChip T={T} tone={bad ? "bad" : d.status === "processed" ? "good" : "faint"}>{d.status}</StatusChip>
                  <span style={{ color: T.faint }}>{new Date(d.created_at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            );
          })}
          {webhookDeliveries.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No webhook deliveries recorded yet.</div>}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="flex items-center gap-1.5 text-sm font-bold"><Send size={14} style={{ color: T.gold }} />Message log</div>
        <div className="mt-0.5 text-xs" style={{ color: T.faint }}>WhatsApp/SMS lead alerts, quote and dispute updates — real sends when a provider is configured, logged either way.</div>
        <div className="mt-2.5 space-y-1.5">
          {messageLog.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs" style={{ background: T.panel2 }}>
              <div className="min-w-0">
                <span className="font-bold">{m.ref}</span>
                <span style={{ color: T.sub }}> · {m.template.replace(/_/g, " ")} · {m.channel}</span>
                {m.to_phone && <span style={{ color: T.faint }}> · {m.to_phone}</span>}
                <div className="mt-0.5 truncate" style={{ color: T.faint, maxWidth: 480 }}>{m.payload?.message ?? m.payload?.reason}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <StatusChip T={T} tone={m.status === "sent" ? "good" : m.status === "failed" ? "bad" : "faint"}>{m.status}</StatusChip>
                <span style={{ color: T.faint }}>{new Date(m.created_at).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))}
          {messageLog.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No notifications sent yet.</div>}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="text-sm font-bold">Platform GMV</div>
        <div style={{ height: 160 }} className="mt-2.5">
          <ResponsiveContainer>
            <BarChart data={weeklyGmv} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: T.faint, fontSize: 10 }} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: rgba(T.accent, 0.08) }}
                formatter={(v) => gmvFmt(Number(v))}
                contentStyle={{ background: T.tipBg, border: `1px solid ${T.border}`, borderRadius: 10, color: T.ink, fontSize: 12 }}
              />
              <Bar dataKey="totalCents" name="GMV" radius={[6, 6, 0, 0]} fill={T.accent} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="text-sm font-bold">Ticket conversations ({ticketConvos.length})</div>
        <div className="mt-0.5 text-xs" style={{ color: T.faint }}>Read-only — client↔supplier chats on wedding-squad tickets, for accountability.</div>
        <div className="mt-2.5 space-y-2">
          {ticketConvos.map((c) => (
            <div key={c.ticketId} className="rounded-xl border p-2.5" style={{ borderColor: T.border }}>
              <button onClick={() => setOpenTicketConvoId(openTicketConvoId === c.ticketId ? null : c.ticketId)} className="press flex w-full flex-wrap items-center justify-between gap-2 text-left">
                <div className="min-w-0">
                  <div className="text-xs font-bold">{c.supplierName} <span className="font-normal" style={{ color: T.sub }}>· {c.ref}</span></div>
                  <div className="mt-0.5 text-[10px]" style={{ color: T.faint }}>{c.count} message{c.count > 1 ? "s" : ""} · last {new Date(c.lastAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <MessageCircle size={13} style={{ color: T.faint }} />
              </button>
              {openTicketConvoId === c.ticketId && (
                <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: T.border }}>
                  <TicketThread T={T} ticketId={c.ticketId} readOnly />
                </div>
              )}
            </div>
          ))}
          {ticketConvos.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No ticket conversations yet.</div>}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-bold"><LifeBuoy size={14} style={{ color: T.gold }} />Tickets ({supportTickets.length})</div>
          <select
            value={supportFilter}
            onChange={(e) => setSupportFilter(e.target.value)}
            className="rounded-lg px-2 py-1 text-[11px] font-semibold outline-none"
            style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}
          >
            <option value="active">Active</option>
            <option value="all">All</option>
            {["open", "assigned", "accepted", "in_progress", "waiting_client", "waiting_supplier", "resolved", "closed", "reopened"].map((s) => (
              <option key={s} value={s}>{TICKET_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div className="mt-2.5 space-y-2">
          {supportTickets.map((t) => (
            <div key={t.id} className="rounded-xl border p-2.5" style={{ borderColor: T.border }}>
              <button onClick={() => setOpenSupportId(openSupportId === t.id ? null : t.id)} className="press flex w-full flex-wrap items-center justify-between gap-2 text-left">
                <div className="min-w-0 text-xs font-bold">
                  {t.ref} <span className="font-normal" style={{ color: T.sub }}>· {t.suppliers?.name ?? "no supplier"} · {t.events ? `${t.events.type}${t.events.event_date ? " " + new Date(`${t.events.event_date}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : ""}` : "general"} · {t.category.replace("_", " ")} · {t.priority}</span>
                </div>
                <StatusChip T={T} tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_LABEL[t.status]}</StatusChip>
              </button>
              {openSupportId === t.id && (
                <TicketV2Card T={T} ticketId={t.id} ticketRef={t.ref} status={t.status} viewerRole="admin" onChanged={() => setOpenSupportId(t.id)} />
              )}
            </div>
          ))}
          {supportTickets.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No tickets match this filter.</div>}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="flex items-center gap-1.5 text-sm font-bold"><Receipt size={14} style={{ color: T.gold }} />Quotes ({quotes.length})</div>
        <div className="mt-0.5 text-xs" style={{ color: T.faint }}>Every quote sent across every supplier, latest version first.</div>
        <div className="mt-2.5 space-y-2">
          {quotes.map((q) => {
            const latest = q.quote_versions.find((v) => v.version === q.current_version) ?? q.quote_versions[q.quote_versions.length - 1];
            return (
              <div key={q.id} className="rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                <button onClick={() => setOpenQuoteId(openQuoteId === q.id ? null : q.id)} className="press flex w-full flex-wrap items-center justify-between gap-2 text-left">
                  <div className="min-w-0 text-xs font-bold">
                    {q.ref} <span className="font-normal" style={{ color: T.sub }}>· {q.supplier_tickets?.suppliers?.name ?? "unknown supplier"} · {q.supplier_tickets?.ref} · v{q.current_version}{latest ? ` · ${gmvFmt(latest.total_cents)}` : ""}</span>
                  </div>
                  <StatusChip T={T} tone={q.status === "accepted" ? "good" : q.status === "declined" ? "bad" : q.status === "change_requested" ? "warn" : "accent"}>{q.status.replace("_", " ")}</StatusChip>
                </button>
                {openQuoteId === q.id && latest && (
                  <div className="mt-2.5 space-y-1 border-t pt-2.5" style={{ borderColor: T.border }}>
                    {latest.quote_items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span style={{ color: T.sub }}>{it.label} × {it.qty}</span>
                        <span className="tnum font-bold">{gmvFmt(it.line_total_cents)}</span>
                      </div>
                    ))}
                    {latest.note && <div className="mt-1 text-xs" style={{ color: T.faint }}>Note: {latest.note}</div>}
                  </div>
                )}
              </div>
            );
          })}
          {quotes.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No quotes sent yet.</div>}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="flex items-center gap-1.5 text-sm font-bold"><Receipt size={14} style={{ color: T.gold }} />Orders ({orders.length})</div>
        <div className="mt-0.5 text-xs" style={{ color: T.faint }}>Paid Stitch-It bookings — refund moves real money back via Paystack.</div>
        <div className="mt-2.5 space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
              <div className="min-w-0 text-xs font-bold">
                {o.ref} <span className="font-normal" style={{ color: T.sub }}>· {o.customer_name} · {o.customer_phone} · {gmvFmt(o.total_cents)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <StatusChip T={T} tone={o.status === "refunded" ? "faint" : "good"}>{o.status}</StatusChip>
                {o.status === "paid" && (
                  <button
                    disabled={refundingRef === o.ref}
                    onClick={() => setRefundDialogRef(o.ref)}
                    className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60"
                    style={{ background: rgba(T.bad, 0.12), color: T.bad }}
                  >
                    {refundingRef === o.ref ? "Refunding…" : "Refund"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No paid orders yet.</div>}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="flex items-center gap-1.5 text-sm font-bold"><Percent size={14} style={{ color: T.gold }} />Promotions ({promotions.filter((p) => p.status === "published").length} live)</div>
        <div className="mt-0.5 text-xs" style={{ color: T.faint }}>Moderation — unpublish anything inappropriate.</div>
        <div className="mt-2.5 space-y-2">
          {promotions.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
              <div className="min-w-0">
                <div className="text-xs font-bold">{p.title} <span className="font-normal" style={{ color: T.sub }}>· {p.suppliers?.name ?? "unknown supplier"}</span>{p.discount_label && <span style={{ color: T.gold }}> · {p.discount_label}</span>}</div>
                <div className="mt-0.5 text-[10px]" style={{ color: T.faint }}>{p.ref}{p.applicable_date && ` · ${new Date(`${p.applicable_date}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "long" })}`}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <StatusChip T={T} tone={p.status === "published" ? "good" : "faint"}>{p.status}</StatusChip>
                {p.status === "published" && (
                  <button disabled={busyId === p.ref} onClick={() => moderatePromotion(p.ref)} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnG}>
                    {busyId === p.ref ? "Working…" : "Unpublish"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {promotions.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No promotions yet.</div>}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="text-sm font-bold">Suppliers ({suppliers.length})</div>
        <div className="mt-2.5 space-y-2">
          {suppliers.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
              <div className="min-w-0">
                <div className="text-xs font-bold">{s.name} <span className="font-normal" style={{ color: T.sub }}>· {s.category}</span></div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <StatusChip T={T} tone={s.verified ? "good" : "faint"}>{s.verified ? "Verified" : "Unverified"}</StatusChip>
                  <StatusChip T={T} tone={s.status === "active" ? "good" : s.status === "suspended" ? "bad" : "warn"}>{s.status}</StatusChip>
                  {featuredIds.has(s.id) && <StatusChip T={T} tone="accent"><Sparkles size={10} />Featured</StatusChip>}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                <button disabled={busyId === s.id || s.verified} onClick={() => setVerification(s.id, "verified")} className="press flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50" style={btnA}>
                  <ShieldCheck size={11} />{busyId === s.id ? "Working…" : "Verify"}
                </button>
                <button disabled={busyId === s.id || !s.verified} onClick={() => setVerification(s.id, "rejected")} className="press flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50" style={btnG}>
                  <ShieldOff size={11} />Reject
                </button>
                <button disabled={busyId === s.id} onClick={() => toggleFeatured(s.id)} className="press flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50" style={btnG}>
                  <Sparkles size={11} />{featuredIds.has(s.id) ? "Unfeature" : "Feature"}
                </button>
                <button
                  disabled={busyId === s.id}
                  onClick={() => toggleSuspend(s.id, s.status !== "suspended")}
                  className="press flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50"
                  style={s.status === "suspended" ? btnA : { background: rgba(T.bad, 0.12), color: T.bad, border: `1px solid ${rgba(T.bad, 0.4)}` }}
                >
                  <Ban size={11} />{s.status === "suspended" ? "Reinstate" : "Suspend"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="text-sm font-bold">Supplier tickets ({tickets.length} pending)</div>
        <div className="mt-2.5 space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5" style={{ borderColor: rgba(T.warn, 0.4), background: rgba(T.warn, 0.06) }}>
              <div className="min-w-0">
                <div className="text-xs font-bold">{ticket.suppliers?.name ?? "unknown supplier"} <span className="font-normal" style={{ color: T.sub }}>· {ticket.suppliers?.category}</span></div>
                <div className="mt-0.5 text-[10px]" style={{ color: T.faint }}>{ticket.ref}</div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button disabled={busyId === ticket.ref} onClick={() => confirmTicket(ticket.ref)} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
                  {busyId === ticket.ref ? "Working…" : "Yes, confirm"}
                </button>
                <button disabled={busyId === ticket.ref} onClick={() => declineTicket(ticket.ref)} className="press rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnG}>
                  {busyId === ticket.ref ? "Working…" : "No"}
                </button>
              </div>
            </div>
          ))}
          {tickets.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No pending tickets.</div>}
        </div>
      </PortalCard>

      <PortalCard T={T}>
        <div className="text-sm font-bold">Lead board ({leads.filter((l) => l.status === "new").length} new)</div>
        <div className="mt-2.5 space-y-2">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-xl border p-2.5" style={{ borderColor: T.border }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold">{lead.requester_name} <span className="font-normal" style={{ color: T.sub }}>· {lead.requester_phone}</span></div>
                  <div className="mt-0.5 text-[11px]" style={{ color: T.sub }}>{lead.suppliers?.name ?? "unknown supplier"} · {lead.suppliers?.category}</div>
                  <div className="mt-0.5 text-[10px]" style={{ color: T.faint }}>{lead.ref}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => setOpenLeadThreadId(openLeadThreadId === lead.id ? null : lead.id)} className="press flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={btnG}>
                    <MessageCircle size={11} />Conversation
                  </button>
                  <StatusChip T={T} tone={lead.status === "new" ? "warn" : lead.status === "accepted" ? "good" : "bad"}>{lead.status}</StatusChip>
                </div>
              </div>
              {openLeadThreadId === lead.id && (
                <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: T.border }}>
                  <LeadThreadPanel T={T} leadRef={lead.ref} withSession />
                </div>
              )}
            </div>
          ))}
          {leads.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No leads yet.</div>}
        </div>
      </PortalCard>

      <ConfirmDialog
        T={T}
        open={refundDialogRef !== null}
        title={`Refund ${refundDialogRef ?? ""}?`}
        message="This moves real money back via Paystack — give a reason for the audit trail."
        confirmLabel="Issue refund"
        danger
        promptLabel="Reason for refunding"
        promptPlaceholder="e.g. supplier no-show, duplicate charge…"
        onConfirm={confirmRefund}
        onCancel={() => setRefundDialogRef(null)}
      />
    </PortalShell>
  );
}
