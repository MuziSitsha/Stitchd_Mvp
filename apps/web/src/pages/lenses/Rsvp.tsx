import { useMemo, useState } from "react";
import { AlertTriangle, Bell, Check, Utensils, MapPin, Phone, Mail, MessageSquare, ChevronDown } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Chip } from "../../components/proto/Chip";
import { Ring } from "../../components/proto/Ring";
import { Face } from "../../components/proto/Face";
import { WEDDING, RSVP_DAYS, RSVP_BASE, REL_GROUPS, REL_SHORT, GUEST_QUOTES } from "../../components/proto/data";
import { useProtoState, type RsvpVal, type Guest } from "../../state/ProtoState";
import type { LensKey } from "../../components/proto/AppShell";

const RSVP_C: Record<RsvpVal, string> = { yes: "#3FB27F", no: "#F0644C", pending: "#E9B84C" };

function nudgeMsg(g: Guest) {
  return `Hi ${g.name.split(" ")[0]}, it's Lungi from VIP Hosting. Junior & Nadine are getting married on Saturday 14 November 2026 at Oakfield Farm, Muldersdrift. We have you down for ${g.party} seat${g.party > 1 ? "s" : ""}. Could you confirm by ${WEDDING.rsvpDeadline}? Let me know any dietary needs and I'll pass them to the caterer.`;
}

// Ported (and extended) from stitchd-v9.jsx lines 1902-2005 — the funnel/
// feed/nudge section above is new real content (built from the same gList
// this file already owned), the individual-editing table below is the
// original, unchanged and still the only place an RSVP actually gets set.
export function Rsvp({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T } = useTheme();
  const { gList, tables, setRsvp, markReminded, chaseRsvp, channelLink, chased, guests, profile, toast } = useProtoState();
  const [rsvpFilter, setRsvpFilter] = useState("pending");
  const [guestRel, setGuestRel] = useState("all");
  const [guestQ, setGuestQ] = useState("");
  const [guestSel, setGuestSel] = useState<Set<string>>(new Set());
  const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };

  const quoted = useMemo(() => gList.filter((g) => GUEST_QUOTES[g.id]), [gList]);
  const pendingSample = useMemo(() => gList.find((g) => g.rsvp === "pending"), [gList]);

  const rsvp = useMemo(() => {
    const seats = gList.reduce((a, g) => a + g.party, 0);
    const yesSeats = gList.filter((g) => g.rsvp === "yes").reduce((a, g) => a + g.party, 0);
    const pendSeats = gList.filter((g) => g.rsvp === "pending").reduce((a, g) => a + g.party, 0);
    const pending = gList.filter((g) => g.rsvp === "pending");
    const needs: Record<string, number> = {};
    gList.filter((g) => g.rsvp === "yes").forEach((g) => g.needs.forEach(([k, n]) => { needs[k] = (needs[k] || 0) + n; }));
    needs.Halal = (needs.Halal || 0) + RSVP_BASE.halal;
    needs.Vegetarian = (needs.Vegetarian || 0) + RSVP_BASE.veg;
    return {
      pendSeats,
      yes: gList.filter((g) => g.rsvp === "yes").length,
      pend: pending.length,
      no: gList.filter((g) => g.rsvp === "no").length,
      headcount: RSVP_BASE.seats + yesSeats,
      maxcount: RSVP_BASE.seats + yesSeats + pendSeats,
      needs: Object.entries(needs).filter(([, n]) => n > 0),
      pct: Math.round(((seats - pendSeats) / (seats || 1)) * 100),
    };
  }, [gList]);

  const rows = gList
    .filter((g) => rsvpFilter === "all" || g.rsvp === rsvpFilter)
    .filter((g) => guestRel === "all" || g.rel === guestRel)
    .filter((g) => guestQ === "" || `${g.name} ${g.house}`.toLowerCase().includes(guestQ.toLowerCase()));
  const relCol = (g: (typeof gList)[number]) => (g.rel.startsWith("Bride") ? "#D98A9A" : g.rel.startsWith("Groom") ? "#6C93CC" : g.child ? T.warn : T.info);
  const allSel = rows.length > 0 && rows.every((g) => guestSel.has(g.id));

  return (
    <div className="space-y-3 rise">
      <Card T={T} style={{ borderColor: rsvp.pend > 0 ? rgba(T.bad, 0.5) : rgba(T.good, 0.4) }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-4">
            <Ring score={rsvp.pct} T={T} size={84} label="in" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span style={{ ...bigNum, fontSize: 18 }}>RSVP tracker</span>
                {rsvp.pend > 0 && <Chip c={T.bad} T={T}><AlertTriangle size={11} />Critical</Chip>}
              </div>
              <div className="text-xs" style={{ color: T.sub }}>
                Deadline {WEDDING.rsvpDeadline} · <b style={{ color: RSVP_DAYS < 90 ? T.bad : T.sub }}>{RSVP_DAYS} days left</b> · <b style={{ color: T.ink }}>{rsvp.pendSeats} seats</b> still unanswered on this list.
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={chaseRsvp}
                  disabled={rsvp.pend === 0}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold"
                  style={rsvp.pend === 0 ? { background: "transparent", color: T.sub, border: `1px solid ${T.border}`, opacity: 0.6 } : { background: T.accent, color: T.onAccent }}
                >
                  <Bell size={13} />Queue {profile.comm} round · {rsvp.pend}
                </button>
                {chased && <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: T.good }}><Check size={13} />Reminder logged against each household</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {([["Confirmed", rsvp.yes, T.good], ["Pending", rsvp.pend, T.warn], ["Declined", rsvp.no, T.bad]] as [string, number, string][]).map(([l, n, c]) => (
              <div key={l} className="rounded-xl border p-2.5 text-center" style={{ borderColor: T.border, minWidth: 74 }}>
                <div style={{ ...bigNum, fontSize: 22, color: c }}>{n}</div>
                <div className="text-xs" style={{ color: T.sub }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px] lg:items-start">
        <Card T={T}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold">What people are saying</span>
            <button onClick={() => setLens("guestlist")} className="text-xs font-bold" style={{ color: T.accent }}>Full guest list →</button>
          </div>
          <div className="space-y-2">
            {quoted.map((g) => (
              <div key={g.id} className="flex items-start gap-2.5 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                <Face seed={g.id} T={T} size={32} name={g.name} ring={rgba(RSVP_C[g.rsvp], 0.7)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-bold">{g.house}</span>
                    <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: rgba(RSVP_C[g.rsvp], 0.14), color: RSVP_C[g.rsvp] }}>{g.rsvp === "yes" ? "Coming" : g.rsvp === "no" ? "Can't come" : "Pending"}</span>
                  </div>
                  <div className="mt-0.5 text-xs leading-snug" style={{ color: T.sub }}>"{GUEST_QUOTES[g.id]}"</div>
                </div>
              </div>
            ))}
            {quoted.length === 0 && <div className="py-4 text-center text-xs" style={{ color: T.faint }}>No replies with notes yet.</div>}
          </div>
        </Card>

        <Card T={T} style={{ background: "#1A1726", borderColor: "#1A1726" }}>
          <div className="text-xs font-bold" style={{ color: "#F2C14E", letterSpacing: 1 }}>NUDGE THE QUIET ONES</div>
          <div className="mt-1.5 text-sm font-extrabold leading-snug" style={{ color: "#fff" }}>{rsvp.pend} household{rsvp.pend === 1 ? "" : "s"} never replied. Send it again in your own words.</div>
          {pendingSample && (
            <div className="mt-2.5 rounded-xl p-2.5 text-xs leading-relaxed" style={{ background: rgba("#fff", 0.08), color: rgba("#fff", 0.85) }}>
              "{nudgeMsg(pendingSample)}"
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pendingSample && (
              <a href={`https://wa.me/${pendingSample.ph}?text=${encodeURIComponent(nudgeMsg(pendingSample))}`} target="_blank" rel="noreferrer" onClick={() => markReminded(pendingSample.id)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#25D366", color: "#fff" }}>
                <MessageSquare size={12} />WhatsApp
              </a>
            )}
            {pendingSample && (
              <a href={`mailto:${pendingSample.em}?subject=${encodeURIComponent("RSVP — Junior & Nadine, 14 Nov 2026")}&body=${encodeURIComponent(nudgeMsg(pendingSample))}`} onClick={() => markReminded(pendingSample.id)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: rgba("#fff", 0.12), color: "#fff" }}>
                <Mail size={12} />Email
              </a>
            )}
          </div>
          <button
            onClick={chaseRsvp}
            disabled={rsvp.pend === 0}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50"
            style={{ background: "#F2C14E", color: "#3A2A05" }}
          >
            <Bell size={13} />Send to {rsvp.pend} household{rsvp.pend === 1 ? "" : "s"}
          </button>
          {chased && <div className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: "#3FD68C" }}><Check size={13} />Reminder logged against each household</div>}
        </Card>
      </div>

      <Card T={T}>
        <div className="flex items-center gap-2">
          <Utensils size={15} style={{ color: T.gold }} />
          <span className="text-sm font-bold">What the caterer gets told</span>
          <span className="ml-auto text-xs" style={{ color: T.sub }}>updates on every reply</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {([["Confirmed seats", rsvp.headcount, T.good], ["Worst case", rsvp.maxcount, T.warn], ["Catered for", guests, T.ink]] as [string, number, string][]).map(([l, v, c]) => (
            <div key={l} className="rounded-xl p-2" style={{ background: T.panel2 }}>
              <div style={{ ...bigNum, fontSize: 20, color: c }}>{v}</div>
              <div className="text-xs" style={{ color: T.sub }}>{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs" style={{ color: T.sub }}>Dietary:</span>
          {rsvp.needs.map(([k, n]) => <Chip key={k} c={T.info} T={T}>{k} × {n}</Chip>)}
        </div>
        <div className="mt-2 text-xs" style={{ color: rsvp.maxcount > guests ? T.bad : T.sub }}>
          {rsvp.maxcount > guests
            ? `If every pending household says yes you seat ${rsvp.maxcount} against ${guests} catered — Taste Affair needs ${rsvp.maxcount - guests} more covers.`
            : `${guests - rsvp.headcount} covers still unallocated. Final numbers due to Taste Affair 14 days before the day.`}
        </div>
      </Card>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 px-0.5 text-sm font-bold" style={{ color: T.ink }}>
          <ChevronDown size={14} className="transition-transform group-open:rotate-180" style={{ color: T.faint }} />
          Manage individual RSVPs
        </summary>
        <div className="mt-2 space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {([["pending", `Pending ${rsvp.pend}`], ["yes", `Confirmed ${rsvp.yes}`], ["no", `Declined ${rsvp.no}`], ["all", `All ${gList.length}`]] as [string, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setRsvpFilter(k)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold press"
            style={rsvpFilter === k ? { background: T.accent, color: T.onAccent } : { color: T.sub, background: T.panel2 }}
          >
            {l}
          </button>
        ))}
        <select value={guestRel} onChange={(e) => setGuestRel(e.target.value)} className="rounded-full px-3 py-1.5 text-xs" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}>
          <option value="all">All relationships</option>
          {REL_GROUPS.map((r) => <option key={r} value={r}>{REL_SHORT[r]}</option>)}
        </select>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: T.panel2, color: T.ink, border: `1px solid ${T.border}` }}>
          <MapPin size={12} style={{ color: T.faint }} />
          <input value={guestQ} onChange={(e) => setGuestQ(e.target.value)} placeholder="Search name or household…" className="min-w-0 flex-1 bg-transparent text-xs outline-none" style={{ color: T.ink }} />
        </div>
      </div>

      <Card T={T} className="overflow-hidden !p-0">
        {guestSel.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2" style={{ borderColor: T.border, background: rgba(T.accent, 0.06) }}>
            <span className="text-xs font-bold" style={{ color: T.accent }}>{guestSel.size} selected</span>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {([["yes", "Confirm", T.good], ["pending", "Reset", T.warn], ["no", "Decline", T.bad]] as [RsvpVal, string, string][]).map(([v, l, c]) => (
                <button
                  key={v}
                  onClick={() => { guestSel.forEach((id) => setRsvp(id, v)); toast(`${guestSel.size} guests → ${l}`); setGuestSel(new Set()); }}
                  className="rounded-lg px-2.5 py-1 text-xs font-bold"
                  style={{ background: rgba(c, 0.14), color: c }}
                >
                  {l}
                </button>
              ))}
              <button
                onClick={() => { guestSel.forEach((id) => markReminded(id)); toast(`${guestSel.size} reminders logged`); setGuestSel(new Set()); }}
                className="rounded-lg px-2.5 py-1 text-xs font-bold"
                style={{ background: "transparent", color: T.sub, border: `1px solid ${T.border}` }}
              >
                Remind
              </button>
              <button onClick={() => setGuestSel(new Set())} className="rounded-lg px-2 py-1 text-xs" style={{ color: T.faint }}>Clear</button>
            </div>
          </div>
        )}
        <div className="hidden items-center gap-2 border-b px-3 py-2 sm:flex" style={{ borderColor: T.border, background: T.panel2 }}>
          <button
            onClick={() => setGuestSel(allSel ? new Set() : new Set(rows.map((g) => g.id)))}
            className="flex h-4 w-4 items-center justify-center rounded border"
            style={{ borderColor: allSel ? T.accent : T.faint, background: allSel ? T.accent : "transparent" }}
          >
            {allSel && <Check size={11} style={{ color: T.onAccent }} />}
          </button>
          <span className="flex-1 text-xs font-bold" style={{ color: T.sub }}>Guest</span>
          <span className="w-32 text-xs font-bold" style={{ color: T.sub }}>Relationship</span>
          <span className="w-24 text-xs font-bold" style={{ color: T.sub }}>Household</span>
          <span className="w-10 text-center text-xs font-bold" style={{ color: T.sub }}>Seats</span>
          <span className="w-16 text-xs font-bold" style={{ color: T.sub }}>Table</span>
          <span className="w-28 text-xs font-bold" style={{ color: T.sub }}>Meal</span>
          <span className="w-36 text-right text-xs font-bold" style={{ color: T.sub }}>RSVP</span>
        </div>
        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {rows.map((g) => {
            const c = relCol(g);
            const sel = guestSel.has(g.id);
            const tbl = tables.find((t) => t.id === g.table);
            return (
              <div key={g.id} className="flex flex-wrap items-center gap-2 border-b px-3 py-2 sm:flex-nowrap" style={{ borderColor: T.border, background: sel ? rgba(T.accent, 0.05) : "transparent" }}>
                <button
                  onClick={() => setGuestSel((s) => { const n = new Set(s); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })}
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  style={{ borderColor: sel ? T.accent : T.faint, background: sel ? T.accent : "transparent" }}
                >
                  {sel && <Check size={11} style={{ color: T.onAccent }} />}
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Face seed={g.id} T={T} size={30} name={g.name} tone={c} ring={rgba(RSVP_C[g.rsvp], 0.7)} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{g.name}</div>
                    <div className="truncate text-xs sm:hidden" style={{ color: c }}>{REL_SHORT[g.rel]} · {g.house}</div>
                  </div>
                </div>
                <span className="hidden w-32 truncate text-xs sm:block" style={{ color: c }}>{REL_SHORT[g.rel]}</span>
                <span className="hidden w-24 truncate text-xs sm:block" style={{ color: T.sub }}>{g.house}</span>
                <span className="hidden w-10 text-center text-xs tnum sm:block" style={{ color: T.ink }}>{g.party}</span>
                <span className="hidden w-16 text-xs sm:block" style={{ color: g.table ? T.ink : T.faint }}>{tbl ? tbl.name.replace(/ —.*/, "") : "—"}</span>
                <span className="hidden w-28 truncate text-xs sm:block" style={{ color: T.sub }}>{g.needs.length ? g.needs.map(([k]) => k).join(", ") : "Standard"}</span>
                <div className="flex w-full items-center justify-end gap-1 sm:w-36">
                  {([["yes", "Y", T.good], ["pending", "?", T.warn], ["no", "N", T.bad]] as [RsvpVal, string, string][]).map(([v, l, cc]) => (
                    <button
                      key={v}
                      onClick={() => setRsvp(g.id, v)}
                      className="h-6 w-6 rounded text-xs font-bold"
                      style={g.rsvp === v ? { background: cc, color: "#fff" } : { background: rgba(cc, 0.12), color: cc }}
                    >
                      {l}
                    </button>
                  ))}
                  <a
                    href={channelLink(g)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => markReminded(g.id)}
                    aria-label={`Message ${g.name}`}
                    className="flex h-6 w-6 items-center justify-center rounded"
                    style={{ background: "transparent", color: T.sub, border: `1px solid ${T.border}` }}
                  >
                    {profile.comm === "Call" ? <Phone size={11} /> : profile.comm === "Email" ? <Mail size={11} /> : <MessageSquare size={11} />}
                  </a>
                </div>
              </div>
            );
          })}
          {rows.length === 0 && <div className="py-8 text-center text-sm" style={{ color: T.sub }}>No guests match. Try another filter.</div>}
        </div>
      </Card>
      <div className="text-xs" style={{ color: T.faint }}>Tick rows for bulk confirm / decline / remind · message button opens {profile.comm} pre-written · seat guests in the Seating tab. Demo contacts.</div>
        </div>
      </details>
    </div>
  );
}
