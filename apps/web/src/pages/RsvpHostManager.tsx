import { useEffect, useState, useCallback } from "react";
import { Plus, X, Link2, Copy, Check } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { useAuth } from "../lib/useAuth";
import { supabase } from "../lib/supabase";
import { PortalShell, PortalCard, StatTile, StatusChip } from "../components/PortalShell";
import { importRsvpGuests, publishRsvpInvitation } from "../lib/functions";

// The real, additive RSVP host manager — deliberately a separate page from
// pages/lenses/Rsvp.tsx, not a rewrite of it. That lens is the polished
// pitch-demo tracker running on hand-built sample data the app is shown to
// investors on; gutting it to run on a brand-new, mostly-empty real backend
// would break a working demo to half-build a different one in its place.
// This is the actual production feature, reachable in its own right.
interface FunctionRow { id: string; name: string; starts_at: string | null }
interface EntitlementRow { function_id: string; plus_one_allowed: boolean }
interface ResponseRow { function_id: string; state: string; answer: string | null; meal: string | null }
interface GuestRow { id: string; display_name: string; person_type: string; guest_entitlements: EntitlementRow[]; guest_responses: ResponseRow[] }
interface HouseholdRow { id: string; label: string; guests: GuestRow[] }

interface NewGuestDraft { display_name: string; person_type: "adult" | "child"; function_ids: Set<string> }

export function RsvpHostManager() {
  const { T } = useTheme();
  const { session, loading: authLoading } = useAuth();
  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [functions, setFunctions] = useState<FunctionRow[]>([]);
  const [households, setHouseholds] = useState<HouseholdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newGuests, setNewGuests] = useState<NewGuestDraft[]>([{ display_name: "", person_type: "adult", function_ids: new Set() }]);
  const [saving, setSaving] = useState(false);

  const [publishedLink, setPublishedLink] = useState<{ householdId: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const { data: event } = await supabase.from("events").select("id").eq("owner_id", session.user.id).maybeSingle();
    setEventId(event?.id ?? null);
    if (!event) { setLoading(false); return; }

    const { data: fns } = await supabase.from("functions").select("id, name, starts_at").eq("event_id", event.id).order("starts_at");
    setFunctions(fns ?? []);

    const { data: hh, error: hhErr } = await supabase
      .from("households")
      .select("id, label, guests(id, display_name, person_type, guest_entitlements(function_id, plus_one_allowed), guest_responses(function_id, state, answer, meal))")
      .eq("event_id", event.id)
      .order("created_at");
    if (hhErr) setError(hhErr.message);
    setHouseholds((hh as unknown as HouseholdRow[]) ?? []);
    setLoading(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  // Live counts without a manual refresh — same idiom as the rest of this
  // app (guest_responses is already in the realtime publication).
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`rsvp-host-${eventId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_responses" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, load]);

  function addGuestRow() {
    setNewGuests((prev) => [...prev, { display_name: "", person_type: "adult", function_ids: new Set() }]);
  }
  function updateGuestRow(i: number, patch: Partial<NewGuestDraft>) {
    setNewGuests((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }
  function toggleFunction(i: number, fid: string) {
    setNewGuests((prev) => prev.map((g, idx) => {
      if (idx !== i) return g;
      const next = new Set(g.function_ids);
      if (next.has(fid)) next.delete(fid); else next.add(fid);
      return { ...g, function_ids: next };
    }));
  }

  async function handleImport() {
    if (!eventId || !newLabel.trim()) return;
    const validGuests = newGuests.filter((g) => g.display_name.trim() && g.function_ids.size > 0);
    if (validGuests.length === 0) {
      setError("Add at least one guest with a name and at least one function ticked.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await importRsvpGuests(eventId, crypto.randomUUID(), [{
        label: newLabel.trim(),
        guests: validGuests.map((g) => ({ display_name: g.display_name.trim(), person_type: g.person_type, function_ids: [...g.function_ids] })),
      }]);
      setNewLabel("");
      setNewGuests([{ display_name: "", person_type: "adult", function_ids: new Set() }]);
      setAdding(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add that household.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(householdId: string) {
    setError(null);
    try {
      const { token } = await publishRsvpInvitation(householdId);
      setPublishedLink({ householdId, url: `${window.location.origin}/invite/${token}` });
      setCopied(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't publish this invitation.");
    }
  }

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm" style={{ background: T.bg, color: T.sub }}>Loading…</div>;
  }
  if (!session) {
    return <div className="flex min-h-screen items-center justify-center text-sm" style={{ background: T.bg, color: T.sub }}>Please sign in to manage RSVPs.</div>;
  }
  if (!eventId) {
    return <div className="flex min-h-screen items-center justify-center p-4 text-center text-sm" style={{ background: T.bg, color: T.sub }}>No wedding set up on this account yet — finish onboarding first.</div>;
  }

  const totalGuests = households.reduce((s, h) => s + h.guests.length, 0);
  const attending = households.reduce((s, h) => s + h.guests.reduce((s2, g) => s2 + g.guest_responses.filter((r) => r.answer === "attending").length, 0), 0);
  const pending = households.reduce((s, h) => s + h.guests.reduce((s2, g) => s2 + g.guest_entitlements.filter((e) => !g.guest_responses.find((r) => r.function_id === e.function_id && r.state === "submitted")).length, 0), 0);

  return (
    <PortalShell eyebrow="Real RSVP" title="Guests & RSVPs" signOutTo="/">
      <div className="grid grid-cols-3 gap-2">
        <StatTile T={T} value={totalGuests} label="Guests" />
        <StatTile T={T} value={attending} label="Attending" color={T.good} />
        <StatTile T={T} value={pending} label="Awaiting reply" color={T.warn} />
      </div>

      {error && <div className="rounded-xl p-2.5 text-center text-xs font-semibold" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>{error}</div>}

      {publishedLink && (
        <PortalCard T={T} style={{ borderColor: T.accent }}>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold" style={{ color: T.accent }}><Link2 size={13} />Invitation ready — share this link now, it won't be shown again</div>
          <div className="flex items-center gap-2">
            <input readOnly value={publishedLink.url} className="min-w-0 flex-1 rounded-lg px-2.5 py-2 text-xs" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }} />
            <button
              onClick={() => { navigator.clipboard.writeText(publishedLink.url).then(() => setCopied(true)); }}
              className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold"
              style={{ background: T.accent, color: T.onAccent }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}
            </button>
          </div>
        </PortalCard>
      )}

      {functions.length === 0 && (
        <PortalCard T={T}><div className="text-xs" style={{ color: T.sub }}>No functions set up on this event yet — add one before inviting guests.</div></PortalCard>
      )}

      {households.map((h) => (
        <PortalCard key={h.id} T={T}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: T.ink }}>{h.label}</span>
            <button onClick={() => handlePublish(h.id)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ background: T.panel2, color: T.accent, border: `1px solid ${T.border}` }}>
              <Link2 size={12} />Publish invite
            </button>
          </div>
          <div className="space-y-1.5">
            {h.guests.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: T.panel2 }}>
                <span className="text-xs font-semibold" style={{ color: T.ink }}>{g.display_name}</span>
                {g.person_type === "child" && <span className="text-[10px]" style={{ color: T.faint }}>(child)</span>}
                <div className="ml-auto flex flex-wrap gap-1">
                  {g.guest_entitlements.map((ent) => {
                    const resp = g.guest_responses.find((r) => r.function_id === ent.function_id);
                    const fn = functions.find((f) => f.id === ent.function_id);
                    if (!resp || resp.state !== "submitted") return <StatusChip key={ent.function_id} T={T} tone="warn">{fn?.name ?? "?"}: pending</StatusChip>;
                    if (resp.answer === "attending") return <StatusChip key={ent.function_id} T={T} tone="good">{fn?.name ?? "?"}: attending{resp.meal ? ` (${resp.meal})` : ""}</StatusChip>;
                    return <StatusChip key={ent.function_id} T={T} tone="bad">{fn?.name ?? "?"}: declined</StatusChip>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </PortalCard>
      ))}

      {adding ? (
        <PortalCard T={T}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold" style={{ color: T.ink }}>Add a household</span>
            <button onClick={() => setAdding(false)} className="rounded-lg p-1.5" style={{ color: T.faint }}><X size={16} /></button>
          </div>
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Household name (e.g. The Dlaminis)" className="mb-2 w-full rounded-lg px-3 py-2 text-xs" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }} />
          <div className="space-y-2">
            {newGuests.map((g, i) => (
              <div key={i} className="rounded-lg p-2" style={{ background: T.panel2 }}>
                <div className="flex items-center gap-2">
                  <input value={g.display_name} onChange={(e) => updateGuestRow(i, { display_name: e.target.value })} placeholder="Guest name" className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs" style={{ background: T.panel, color: T.ink, border: `1px solid ${T.border}` }} />
                  <select value={g.person_type} onChange={(e) => updateGuestRow(i, { person_type: e.target.value as "adult" | "child" })} className="rounded-lg px-2 py-1.5 text-xs" style={{ background: T.panel, color: T.ink, border: `1px solid ${T.border}` }}>
                    <option value="adult">Adult</option>
                    <option value="child">Child</option>
                  </select>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {functions.map((fn) => (
                    <button key={fn.id} type="button" onClick={() => toggleFunction(i, fn.id)} className="rounded-full px-2.5 py-1 text-[11px] font-semibold press" style={g.function_ids.has(fn.id) ? { background: T.accent, color: T.onAccent } : { background: T.panel, color: T.sub, border: `1px solid ${T.border}` }}>
                      {fn.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={addGuestRow} className="mt-2 flex items-center gap-1 text-xs font-bold" style={{ color: T.accent }}><Plus size={13} />Add another guest</button>
          <button onClick={handleImport} disabled={saving} className="mt-3 w-full rounded-xl py-2.5 text-xs font-bold disabled:opacity-50" style={{ background: T.accent, color: T.onAccent }}>
            {saving ? "Saving…" : "Add household"}
          </button>
        </PortalCard>
      ) : (
        <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-3 text-xs font-bold press" style={{ borderColor: T.border, color: T.accent }}>
          <Plus size={14} />Add a household
        </button>
      )}
    </PortalShell>
  );
}
