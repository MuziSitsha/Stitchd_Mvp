import { useState, type FormEvent } from "react";
import { AlertTriangle, Check } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { rgba } from "../../theme/theme";
import { supabase } from "../../lib/supabase";
import { Card } from "./Card";

const CATEGORIES = [
  { value: "supplier_delay", label: "Supplier delay" },
  { value: "payment", label: "Payment issue" },
  { value: "dispute", label: "Dispute" },
] as const;

// Phase 1 of the cross-interface gap-closing pass — clients could raise a
// confirmation request (supplier_tickets) but never a genuine problem
// (tickets). Lives right next to QuoteReceivedCard/the message thread since
// this is the same supplier relationship, additive to a component that
// already exists here. Creates the ticket against the REAL supplier_id/
// event_id pulled from the supplier_tickets row itself (not a fresh
// name-match lookup) so it can never point at the wrong listing.
export function ReportIssueCard({ T, ticketId }: { T: Theme; ticketId: string }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("supplier_delay");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("not signed in");

      const { data: st, error: stErr } = await supabase
        .from("supplier_tickets")
        .select("supplier_id, event_id")
        .eq("id", ticketId)
        .single();
      if (stErr) throw stErr;

      const { data: created, error: createErr } = await supabase
        .from("tickets")
        .insert({
          supplier_id: st.supplier_id,
          event_id: st.event_id,
          category,
          priority,
          created_by: userRes.user.id,
          created_by_role: "client",
          visibility: "supplier",
        })
        .select("id, ref")
        .single();
      if (createErr) throw createErr;

      const { error: commentErr } = await supabase.from("ticket_comments").insert({
        ticket_id: created.id,
        author_id: userRes.user.id,
        author_role: "client",
        body: description.trim(),
      });
      if (commentErr) throw commentErr;

      setSubmittedRef(created.ref);
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to raise this");
    } finally {
      setSubmitting(false);
    }
  }

  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="press flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold" style={btnG}>
        <AlertTriangle size={13} />Report an issue
      </button>
    );
  }

  return (
    <Card T={T}>
      <div className="mb-2 flex items-center gap-2 text-sm font-bold"><AlertTriangle size={15} style={{ color: T.warn }} />Report an issue</div>
      {submittedRef ? (
        <div className="flex items-start gap-2 rounded-lg p-2.5 text-xs" style={{ background: rgba(T.good, 0.1), color: T.good }}>
          <Check size={14} className="mt-0.5 shrink-0" />
          <span>Reported — ref <b>{submittedRef}</b>. Track it under Us → Support.</span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-1.5">
          <div className="flex gap-1.5">
            <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none" style={inputS}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none" style={inputS}>
              {(["low", "medium", "high", "critical"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's going on?" className="w-full rounded-lg px-2.5 py-2 text-xs outline-none" style={{ ...inputS, minHeight: 56 }} />
          {error && <div className="text-xs font-semibold" style={{ color: T.bad }}>{error}</div>}
          <div className="flex gap-1.5">
            <button type="submit" disabled={submitting || !description.trim()} className="press rounded-lg px-3 py-1.5 text-[11px] font-bold disabled:opacity-60" style={btnA}>
              {submitting ? "Sending…" : "Submit"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="press rounded-lg px-3 py-1.5 text-[11px] font-bold" style={btnG}>Cancel</button>
          </div>
        </form>
      )}
    </Card>
  );
}
