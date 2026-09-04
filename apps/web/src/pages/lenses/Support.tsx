import { useEffect, useState, type FormEvent } from "react";
import { LifeBuoy } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { supabase } from "../../lib/supabase";
import { TicketV2Card, TICKET_STATUS_LABEL, TICKET_STATUS_TONE } from "../../components/proto/TicketV2Card";

const CATEGORIES = [
  { value: "guest", label: "Guest issue" },
  { value: "task", label: "Task" },
  { value: "platform_support", label: "Platform support" },
  { value: "other", label: "Other" },
] as const;

interface MyTicket {
  id: string;
  ref: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  suppliers: { name: string } | null;
}

// Us > Support — Phase 1's general (not-tied-to-one-supplier) ticket entry
// point, plus the one place a client can see and track *every* ticket
// they've raised, including the supplier-scoped ones from a SupplierDrawer's
// new "Report an issue" card (both share the same `created_by = you` row).
export function Support() {
  const { T } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("platform_support");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user || cancelled) return;
      const { data: event } = await supabase.from("events").select("id").eq("owner_id", userRes.user.id).maybeSingle();
      if (cancelled) return;
      setEventId(event?.id ?? null);
      setUserId(userRes.user.id);
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadTickets = () => {
      supabase
        .from("tickets")
        .select("id, ref, category, priority, status, created_at, suppliers(name)")
        .eq("created_by", userId)
        .order("created_at", { ascending: false })
        .then(({ data, error: fetchError }) => {
          if (fetchError) setError(fetchError.message);
          else setTickets((data as unknown as MyTicket[]) ?? []);
        });
    };
    loadTickets();

    const channel = supabase
      .channel(`support-tickets-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets", filter: `created_by=eq.${userId}` }, loadTickets)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim() || !eventId) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("not signed in");
      const { data: created, error: createErr } = await supabase
        .from("tickets")
        .insert({
          event_id: eventId,
          category,
          priority,
          created_by: userRes.user.id,
          created_by_role: "client",
          visibility: "internal",
        })
        .select("id")
        .single();
      if (createErr) throw createErr;
      const { error: commentErr } = await supabase.from("ticket_comments").insert({
        ticket_id: created.id,
        author_id: userRes.user.id,
        author_role: "client",
        body: description.trim(),
      });
      if (commentErr) throw commentErr;
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to raise this");
    } finally {
      setSubmitting(false);
    }
  }

  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const btnA = { background: T.accent, color: T.onAccent };

  return (
    <div className="rise space-y-3">
      <Card T={T}>
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><LifeBuoy size={16} style={{ color: T.gold }} />Raise a general issue</div>
        <div className="mb-2.5 text-xs" style={{ color: T.sub }}>For anything that isn't about one specific supplier — guest problems, platform issues, anything else. Goes straight to ops.</div>
        <form onSubmit={submit} className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none" style={inputS}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none" style={inputS}>
              {(["low", "medium", "high", "critical"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's going on?" className="w-full rounded-lg px-2.5 py-2 text-xs outline-none" style={{ ...inputS, minHeight: 60 }} />
          {error && <div className="text-xs font-semibold" style={{ color: T.bad }}>{error}</div>}
          <button type="submit" disabled={submitting || !description.trim() || !eventId} className="press rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
            {submitting ? "Sending…" : "Submit"}
          </button>
        </form>
      </Card>

      <Card T={T}>
        <div className="mb-2.5 text-sm font-bold">Your tickets ({tickets.length})</div>
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl border p-2.5" style={{ borderColor: T.border }}>
              <button onClick={() => setOpenId(openId === t.id ? null : t.id)} className="press flex w-full flex-wrap items-center justify-between gap-2 text-left">
                <div className="min-w-0 text-xs font-bold">
                  {t.ref} <span className="font-normal" style={{ color: T.sub }}>· {t.suppliers?.name ?? "General"} · {t.category.replace("_", " ")}</span>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: rgba({ good: T.good, warn: T.warn, bad: T.bad, accent: T.accent, faint: T.faint }[TICKET_STATUS_TONE[t.status]], 0.14), color: { good: T.good, warn: T.warn, bad: T.bad, accent: T.accent, faint: T.faint }[TICKET_STATUS_TONE[t.status]] }}>
                  {TICKET_STATUS_LABEL[t.status]}
                </span>
              </button>
              {openId === t.id && (
                <TicketV2Card T={T} ticketId={t.id} ticketRef={t.ref} status={t.status} viewerRole="client" onChanged={() => setOpenId(t.id)} />
              )}
            </div>
          ))}
          {tickets.length === 0 && <div className="text-xs" style={{ color: T.faint }}>No tickets raised yet.</div>}
        </div>
      </Card>
    </div>
  );
}
