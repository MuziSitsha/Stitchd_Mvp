import { useMemo, useState } from "react";
import { Bell, Users } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { useProtoState, type Guest } from "../../state/ProtoState";
import { WEDDING } from "../../components/proto/data";

const [PARTNER_A, PARTNER_B] = WEDDING.couple.split(" & ");

const RSVP_C: Record<string, string> = { yes: "#3FB27F", no: "#F0644C", pending: "#E9B84C" };

// Guests > Guest list — a read-oriented household directory, distinct from
// Invitations (which is the action-oriented RSVP tracker/table). Same
// gList data, grouped by household.
export function GuestList() {
  const { T } = useTheme();
  const { gList, chaseRsvp, channelLink, markReminded, profile } = useProtoState();
  const [filter, setFilter] = useState<"all" | typeof PARTNER_A | typeof PARTNER_B | "Friends">("all");

  const households = useMemo(() => {
    const m = new Map<string, Guest[]>();
    gList.forEach((g) => { const arr = m.get(g.house) ?? []; arr.push(g); m.set(g.house, arr); });
    return [...m.entries()].map(([house, guests]) => {
      const seats = guests.reduce((a, g) => a + g.party, 0);
      const rsvp: "yes" | "no" | "pending" = guests.every((g) => g.rsvp === "yes") ? "yes" : guests.some((g) => g.rsvp === "no") ? "no" : "pending";
      const side = guests[0].rel.startsWith("Bride") ? PARTNER_B : guests[0].rel.startsWith("Groom") ? PARTNER_A : "Friends";
      const notes = guests.flatMap((g) => g.needs.map(([k]) => k));
      return { house, guests, seats, rsvp, side, notes: [...new Set(notes)] };
    });
  }, [gList]);

  const filtered = households.filter((h) => filter === "all" || h.side === filter);

  const replied = gList.filter((g) => g.rsvp !== "pending").length;
  const coming = gList.filter((g) => g.rsvp === "yes").length;
  const declined = gList.filter((g) => g.rsvp === "no").length;
  const dietary = new Set(gList.flatMap((g) => g.needs.map(([k]) => k))).size;
  const pendingHouseholds = households.filter((h) => h.rsvp === "pending").length;
  const firstPending = gList.find((g) => g.rsvp === "pending");

  // Real, not just a state flip: opens an actual WhatsApp/email/call thread
  // for the first quiet household (channelLink already builds the right
  // link + message for whichever channel the couple picked), then queues
  // the same reminder against every other pending household via chaseRsvp
  // so nobody's silently skipped just because only one link can open per
  // click.
  function contactQuietOnes() {
    if (firstPending) {
      window.open(channelLink(firstPending), "_blank");
      markReminded(firstPending.id);
    }
    chaseRsvp();
  }

  return (
    <div className="rise space-y-3">
      <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: "#1A1726" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{coming} are coming.</div>
            <div className="text-xs" style={{ color: rgba("#fff", 0.7) }}>{pendingHouseholds} household{pendingHouseholds === 1 ? "" : "s"} still haven't replied.</div>
          </div>
          <button onClick={contactQuietOnes} disabled={pendingHouseholds === 0} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#F2C14E", color: "#1A1726", opacity: pendingHouseholds === 0 ? 0.5 : 1 }}>
            <Bell size={13} />Contact the quiet ones via {profile.comm}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["Replied", `${replied}/${gList.length}`, T.accent], ["Coming", coming, T.good], ["Can't make it", declined, T.bad], ["Dietary needs", dietary, T.gold]] as const).map(([l, v, c]) => (
          <div key={l} className="rounded-2xl border p-3" style={{ borderColor: T.border, background: T.panel }}>
            <div className="text-2xl font-extrabold" style={{ color: c }}>{v}</div>
            <div className="text-xs" style={{ color: T.sub }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {([["all", `All households · ${households.length}`], [PARTNER_A, `${PARTNER_A}'s side · ${households.filter((h) => h.side === PARTNER_A).length}`], [PARTNER_B, `${PARTNER_B}'s side · ${households.filter((h) => h.side === PARTNER_B).length}`], ["Friends", `Friends · ${households.filter((h) => h.side === "Friends").length}`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className="rounded-full px-3 py-1.5 text-xs font-bold" style={filter === k ? { background: "#1A1726", color: "#fff" } : { background: T.panel2, color: T.sub }}>{l}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border }}>
        <div className="hidden gap-2 border-b px-3 py-2 text-xs font-bold sm:grid" style={{ gridTemplateColumns: "1.7fr .9fr .6fr 1fr .8fr", borderColor: T.border, background: T.panel2, color: T.sub }}>
          <span>Household</span><span>Side</span><span className="text-center">Seats</span><span>Notes</span><span className="text-right">RSVP</span>
        </div>
        {filtered.map((h) => (
          <div key={h.house} className="flex items-center gap-2 border-b px-3 py-2.5 text-xs sm:grid" style={{ borderColor: T.border, background: T.panel, gridTemplateColumns: "1.7fr .9fr .6fr 1fr .8fr" }}>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: rgba(T.accent, 0.15), color: T.accent }}><Users size={12} /></span>
              <div className="min-w-0">
                <div className="truncate font-semibold">{h.house}</div>
                <div className="truncate text-xs sm:hidden" style={{ color: T.sub }}>{h.guests.map((g) => g.name.split(" ")[0]).join(", ")}</div>
              </div>
            </div>
            <span className="hidden sm:block" style={{ color: T.sub }}>{h.side}</span>
            <span className="hidden text-center tnum sm:block">{h.seats}</span>
            <span className="hidden truncate sm:block" style={{ color: h.notes.length ? T.warn : T.faint }}>{h.notes.length ? h.notes.join(", ") : "—"}</span>
            <span className="hidden text-right sm:block">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: rgba(RSVP_C[h.rsvp], 0.14), color: RSVP_C[h.rsvp] }}>{h.rsvp === "yes" ? "Coming" : h.rsvp === "no" ? "Declined" : "Pending"}</span>
            </span>
            <span className="shrink-0 sm:hidden">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: rgba(RSVP_C[h.rsvp], 0.14), color: RSVP_C[h.rsvp] }}>{h.rsvp === "yes" ? "Coming" : h.rsvp === "no" ? "Declined" : "Pending"}</span>
            </span>
          </div>
        ))}
        {filtered.length === 0 && <div className="py-8 text-center text-xs" style={{ color: T.faint }}>No households match.</div>}
      </div>
    </div>
  );
}
