import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle, HelpCircle, Calendar, MapPin } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { Card } from "../components/proto/Card";
import { Logo } from "../components/Logo";
import { exchangeRsvpToken, submitRsvpResponses, type RsvpExchangeResult, type RsvpSubmitInput } from "../lib/functions";

// Part F — the signature release. Three routes exactly as Part C1's page
// inventory names them: /invite/[token] (exchange only, never rendered
// long) -> /rsvp (the actual form, token-free URL) -> /rsvp/confirmed.
// No login anywhere in this file — a wedding guest has no Supabase Auth
// account at all, the session_token from exchange is the only credential,
// held in sessionStorage rather than the URL or localStorage (cleared when
// the tab closes, never sent anywhere but this app, never a long-lived
// value worth persisting past the visit).
const STORAGE_KEY = "stitchd_rsvp_session";

interface StoredSession {
  session_token: string;
  household: RsvpExchangeResult["household"];
  guests: RsvpExchangeResult["guests"];
}

function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}
function saveSession(s: StoredSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Private-browsing/storage-blocked — the form still works for this one
    // visit, it just can't survive a refresh. Not worth failing the flow over.
  }
}

function Shell({ T, children }: { T: ReturnType<typeof useTheme>["T"]; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: T.bg }}>
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo size={22} T={T} dashColor={T.accent} /></div>
        {children}
      </div>
    </div>
  );
}

function ErrorCard({ T, message }: { T: ReturnType<typeof useTheme>["T"]; message: string }) {
  return (
    <Card T={T} className="!p-6 text-center" style={{ borderRadius: 24 }}>
      <div className="text-sm" style={{ color: T.sub }}>{message}</div>
    </Card>
  );
}

// /invite/:token — exchanges once, then gets out of the way. Deliberately
// no long-lived UI here: Part F2 wants the raw token off the URL as soon
// as possible, so this route's only job is the swap and the redirect.
export function RsvpInvite() {
  const { T } = useTheme();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("This invitation link is incomplete — ask your host to resend it.");
      return;
    }
    let cancelled = false;
    exchangeRsvpToken(token)
      .then((result) => {
        if (cancelled) return;
        saveSession({ session_token: result.session_token, household: result.household, guests: result.guests });
        navigate("/rsvp", { replace: true });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "This invitation link is invalid or has expired.");
      });
    return () => { cancelled = true; };
  }, [token, navigate]);

  return (
    <Shell T={T}>
      {error ? <ErrorCard T={T} message={error} /> : (
        <Card T={T} className="!p-6 text-center" style={{ borderRadius: 24 }}>
          <div className="text-sm" style={{ color: T.sub }}>Opening your invitation…</div>
        </Card>
      )}
    </Shell>
  );
}

const MEAL_OPTIONS = ["Standard", "Vegetarian", "Vegan", "Halal"];

interface DraftEntry {
  answer: "attending" | "declined" | null;
  draft: boolean;
  meal: string | null;
  dietary_note: string;
  plus_one_name: string;
  revision: number;
}

function keyFor(guestId: string, functionId: string) {
  return `${guestId}:${functionId}`;
}

// /rsvp — the actual form. "A guest taps a link, sees their own household
// already recognised, answers only the questions that apply to them, and
// is done in under 90 seconds."
export function RsvpGuestForm() {
  const { T } = useTheme();
  const navigate = useNavigate();
  const [session] = useState(() => loadSession());
  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>(() => {
    if (!session) return {};
    const initial: Record<string, DraftEntry> = {};
    for (const guest of session.guests) {
      for (const ent of guest.guest_entitlements) {
        const existing = guest.guest_responses.find((r) => r.function_id === ent.function_id);
        initial[keyFor(guest.id, ent.function_id)] = {
          answer: existing?.answer ?? null,
          draft: existing?.state === "draft",
          meal: existing?.meal ?? null,
          dietary_note: existing?.dietary_note ?? "",
          plus_one_name: existing?.plus_one_name ?? "",
          revision: existing?.revision ?? 0,
        };
      }
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return <Shell T={T}><ErrorCard T={T} message="Please open the invitation link your host sent you." /></Shell>;
  }

  function setEntry(guestId: string, functionId: string, patch: Partial<DraftEntry>) {
    setDrafts((prev) => ({ ...prev, [keyFor(guestId, functionId)]: { ...prev[keyFor(guestId, functionId)], ...patch } }));
  }

  const allAnswered = session.guests.every((g) => g.guest_entitlements.every((ent) => {
    const d = drafts[keyFor(g.id, ent.function_id)];
    return d && (d.answer !== null || d.draft);
  }));

  async function handleSubmit() {
    if (!session) return;
    setSubmitting(true);
    setError(null);
    const responses: RsvpSubmitInput[] = [];
    for (const guest of session.guests) {
      for (const ent of guest.guest_entitlements) {
        const d = drafts[keyFor(guest.id, ent.function_id)];
        if (!d) continue;
        responses.push({
          guest_id: guest.id,
          function_id: ent.function_id,
          answer: d.answer ?? undefined,
          draft: d.draft && d.answer === null,
          meal: d.meal,
          dietary_note: d.dietary_note.trim() || null,
          plus_one_name: d.plus_one_name.trim() || null,
          expected_revision: d.revision,
        });
      }
    }
    try {
      const result = await submitRsvpResponses(session.session_token, responses);
      const conflicted = result.results.some((r) => r.conflict);
      if (conflicted) {
        setError("Someone already updated this response since you opened it — please review and try again.");
        setSubmitting(false);
        return;
      }
      saveSession({ ...session }); // keep household/guests for the confirmation screen
      sessionStorage.setItem(`${STORAGE_KEY}_submitted`, JSON.stringify(drafts));
      navigate("/rsvp/confirmed", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit your RSVP — please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen p-4" style={{ background: T.bg }}>
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo size={22} T={T} dashColor={T.accent} /></div>
        <div className="mb-4 text-center">
          <div className="text-lg font-extrabold" style={{ color: T.ink, fontFamily: "'Archivo Black',sans-serif" }}>
            Hi, {session.household.label}
          </div>
          <div className="mt-1 text-xs" style={{ color: T.sub }}>Let us know who's coming — takes under a minute.</div>
        </div>

        <div className="space-y-3">
          {session.guests.map((guest) => (
            <Card key={guest.id} T={T} className="!p-4" style={{ borderRadius: 20 }}>
              <div className="mb-3 text-sm font-bold" style={{ color: T.ink }}>
                {guest.display_name}{guest.person_type === "child" && <span className="ml-1.5 text-xs font-normal" style={{ color: T.sub }}>(child)</span>}
              </div>
              {guest.guest_entitlements.map((ent) => {
                const entry = drafts[keyFor(guest.id, ent.function_id)];
                const fnName = ent.functions?.name ?? "the event";
                return (
                  <div key={ent.function_id} className="mb-3 last:mb-0">
                    <div className="mb-2 text-xs font-semibold" style={{ color: T.sub }}>{fnName}</div>
                    <div className="flex gap-2">
                      {([
                        ["attending", "Attending", CheckCircle2, T.good],
                        ["declined", "Can't make it", Circle, T.bad],
                        ["unsure", "Not sure yet", HelpCircle, T.warn],
                      ] as const).map(([val, label, Icon, color]) => {
                        const selected = val === "unsure" ? entry?.draft && entry.answer === null : entry?.answer === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setEntry(guest.id, ent.function_id, val === "unsure" ? { answer: null, draft: true } : { answer: val, draft: false })}
                            className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center press"
                            style={{ minHeight: 44, background: selected ? rgba(color, 0.14) : T.panel2, border: `1px solid ${selected ? color : T.border}` }}
                          >
                            <Icon size={16} style={{ color: selected ? color : T.faint }} />
                            <span className="text-[10px] font-bold" style={{ color: selected ? color : T.sub }}>{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {entry?.answer === "attending" && (
                      <div className="mt-2.5 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {MEAL_OPTIONS.map((meal) => (
                            <button
                              key={meal}
                              type="button"
                              onClick={() => setEntry(guest.id, ent.function_id, { meal })}
                              className="rounded-full px-3 py-1.5 text-xs font-semibold press"
                              style={entry.meal === meal ? { background: T.accent, color: T.onAccent } : { background: T.panel2, color: T.sub, border: `1px solid ${T.border}` }}
                            >
                              {meal}
                            </button>
                          ))}
                        </div>
                        <input
                          value={entry.dietary_note}
                          onChange={(e) => setEntry(guest.id, ent.function_id, { dietary_note: e.target.value })}
                          placeholder="Any dietary or accessibility notes? (optional)"
                          className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                          style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}
                        />
                        {ent.plus_one_allowed && (
                          <input
                            value={entry.plus_one_name}
                            onChange={(e) => setEntry(guest.id, ent.function_id, { plus_one_name: e.target.value })}
                            placeholder="Plus-one's name (optional)"
                            className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                            style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          ))}
        </div>

        {error && <div className="mt-3 rounded-xl p-2.5 text-center text-xs font-semibold" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !allAnswered}
          className="mt-4 w-full rounded-xl py-3 text-sm font-bold press disabled:opacity-50"
          style={{ background: T.accent, color: T.onAccent, minHeight: 44 }}
        >
          {submitting ? "Submitting…" : "Confirm my RSVP"}
        </button>
        {!allAnswered && <div className="mt-2 text-center text-xs" style={{ color: T.faint }}>Answer for everyone above to continue.</div>}
      </div>
    </div>
  );
}

// /rsvp/confirmed
export function RsvpConfirmed() {
  const { T } = useTheme();
  const [session] = useState(() => loadSession());

  if (!session) {
    return <Shell T={T}><ErrorCard T={T} message="Please open the invitation link your host sent you." /></Shell>;
  }

  const attendingFunctions = new Map<string, { name: string; starts_at: string | null; location: string | null }>();
  for (const guest of session.guests) {
    for (const ent of guest.guest_entitlements) {
      if (ent.functions) attendingFunctions.set(ent.function_id, ent.functions);
    }
  }

  function icsHref(name: string, startsAt: string | null, location: string | null) {
    const dt = startsAt ? new Date(startsAt) : new Date();
    const stamp = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `SUMMARY:${name}`, `DTSTART:${stamp}`, location ? `LOCATION:${location}` : "", "END:VEVENT", "END:VCALENDAR"]
      .filter(Boolean)
      .join("\r\n");
    return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
  }

  return (
    <Shell T={T}>
      <Card T={T} className="!p-6 text-center" style={{ borderRadius: 24 }}>
        <CheckCircle2 size={36} style={{ color: T.good, margin: "0 auto" }} />
        <div className="mt-3 text-lg font-extrabold" style={{ color: T.ink, fontFamily: "'Archivo Black',sans-serif" }}>Thank you!</div>
        <div className="mt-1 text-xs" style={{ color: T.sub }}>Your RSVP for {session.household.label} has been recorded.</div>

        <div className="mt-4 space-y-2 text-left">
          {[...attendingFunctions.entries()].map(([fid, fn]) => (
            <div key={fid} className="rounded-xl p-3" style={{ background: T.panel2 }}>
              <div className="text-sm font-bold" style={{ color: T.ink }}>{fn.name}</div>
              {fn.starts_at && <div className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: T.sub }}><Calendar size={12} />{new Date(fn.starts_at).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>}
              {fn.location && <div className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: T.sub }}><MapPin size={12} />{fn.location}</div>}
              <a href={icsHref(fn.name, fn.starts_at, fn.location)} download={`${fn.name}.ics`} className="mt-2 inline-block text-xs font-bold" style={{ color: T.accent }}>Add to calendar</a>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs" style={{ color: T.faint }}>You can reopen this link any time before the RSVP deadline to make changes.</div>
      </Card>
    </Shell>
  );
}
