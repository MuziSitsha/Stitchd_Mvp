import { useMemo, useState } from "react";
import { AlertTriangle, Send, Ticket, PartyPopper } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { WEDDING, SECOND_EVENT } from "../../components/proto/data";
import { useProtoState, type Guest } from "../../state/ProtoState";

// Guests > Passes. Household passes below are real, computed from gList/
// tables — that's specifically the white wedding's pass list. The lobola
// celebration has no per-guest breakdown in ProtoState yet (a smaller,
// separate guest list families are still agreeing), so its card in "Your
// gatherings" shows the real planned headcount honestly rather than
// fabricating a household list for it.
export function Passes() {
  const { T } = useTheme();
  const { gList, tables, markReminded, toast } = useProtoState();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  const households = useMemo(() => {
    const m = new Map<string, Guest[]>();
    gList.filter((g) => g.rsvp === "yes").forEach((g) => { const arr = m.get(g.house) ?? []; arr.push(g); m.set(g.house, arr); });
    return [...m.entries()].map(([house, guests]) => ({ house, guests, seats: guests.reduce((a, g) => a + g.party, 0), tableId: guests.find((g) => g.table)?.table ?? null }));
  }, [gList]);

  const noTable = households.filter((h) => !h.tableId);
  const issued = households.length - noTable.length;
  const preview = households.find((h) => h.house === previewId) ?? households.find((h) => h.tableId);

  function sendPass(h: NonNullable<typeof preview>) {
    const tbl = tables.find((t) => t.id === h.tableId);
    const dietary = h.guests.flatMap((g) => g.needs.map(([k]) => k)).join(", ") || "no dietary notes";
    const msg = `Hi ${h.house}, it's Junior & Nadine — here's your pass for 14 November 2026. Ceremony 15:00, ${WEDDING.venue}. You're seated at ${tbl?.name.replace(/^Table \d+\s*—\s*/, "") ?? "your table"}, ${h.seats} seat${h.seats === 1 ? "" : "s"}, ${dietary}. See you there!`;
    const contact = h.guests[0];
    window.open(`https://wa.me/${contact.ph}?text=${encodeURIComponent(msg)}`, "_blank");
    markReminded(contact.id);
    setSent((s) => new Set(s).add(h.house));
    toast(`Pass sent to ${h.house}`);
  }

  return (
    <div className="rise space-y-3">
      <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: "#1A1726" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>One pass per household</div>
        <div className="mt-1 text-xs" style={{ color: rgba("#fff", 0.7) }}>Each pass carries their table, shuttle seat and any dietary note — nothing else to remember on the day.</div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs" style={{ color: rgba("#fff", 0.85) }}>
          <span><b style={{ color: "#F2C14E" }}>{issued}</b> ready to send</span>
          <span><b style={{ color: "#F2C14E" }}>{noTable.length}</b> waiting on a table</span>
        </div>
      </div>

      <div>
        <div className="mb-1.5 px-0.5 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>YOUR GATHERINGS</div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: T.border, background: T.panel }}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: rgba(T.accent, 0.14), color: T.accent }}><Ticket size={15} /></span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">White wedding</div>
              <div className="text-xs" style={{ color: T.sub }}>{WEDDING.dateLabel} · {WEDDING.venue}</div>
            </div>
            <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: rgba(T.good, 0.14), color: T.good }}>{issued} issued</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: T.border, background: T.panel }}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: rgba(T.gold, 0.16), color: T.warn }}><PartyPopper size={15} /></span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{SECOND_EVENT.name}</div>
              <div className="text-xs" style={{ color: T.sub }}>{SECOND_EVENT.dateLabel} · {SECOND_EVENT.venue} · {SECOND_EVENT.guests} guests planned</div>
            </div>
            <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: rgba(T.warn, 0.14), color: T.warn }}>Not sent</span>
          </div>
        </div>
      </div>

      {noTable.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 text-xs font-semibold" style={{ borderColor: rgba(T.warn, 0.4), background: rgba(T.warn, 0.1), color: T.warn }}>
          <span className="flex items-center gap-2"><AlertTriangle size={14} />{noTable.length} household{noTable.length === 1 ? "" : "s"} have no table yet — their passes shouldn't send until they're seated.</span>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-2 sm:grid-cols-2">
          {households.map((h) => (
            <button key={h.house} onClick={() => setPreviewId(h.house)} className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left" style={{ borderColor: previewId === h.house ? T.accent : T.border, background: T.panel }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: rgba(T.accent, 0.14), color: T.accent }}><Ticket size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{h.house}</div>
                <div className="text-xs" style={{ color: T.sub }}>{h.seats} seat{h.seats === 1 ? "" : "s"} · {h.tableId ? tables.find((t) => t.id === h.tableId)?.name.replace(/^Table \d+\s*—\s*/, "") : "No table yet"}</div>
              </div>
              {h.tableId ? (
                <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: rgba(T.good, 0.14), color: T.good }}>Ready</span>
              ) : (
                <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: rgba(T.warn, 0.14), color: T.warn }}>Waiting</span>
              )}
            </button>
          ))}
        </div>

        <div>
          {preview ? (
            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: T.border }}>
              <div className="p-4" style={{ background: "#1A1726", color: "#fff" }}>
                <div className="text-xs" style={{ color: rgba("#fff", 0.7) }}>{WEDDING.couple} · {WEDDING.dateLabel}</div>
                <div className="mt-1 text-lg font-extrabold">{preview.house}</div>
                <div className="text-xs" style={{ color: rgba("#fff", 0.7) }}>{preview.seats} seat{preview.seats === 1 ? "" : "s"} · {preview.tableId ? tables.find((t) => t.id === preview.tableId)?.name.replace(/^Table \d+\s*—\s*/, "") : "Table pending"}</div>
                <div className="mt-3 grid grid-cols-5 gap-1 rounded-xl p-2.5" style={{ width: 96, background: "#0D0B14" }}>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span key={i} className="aspect-square rounded-sm" style={{ background: (i * 7 + preview.house.length) % 3 === 0 ? "#F7F5FB" : "transparent" }} />
                  ))}
                </div>
              </div>
              <div className="space-y-2 p-4 text-xs">
                <div className="flex justify-between"><span style={{ color: T.sub }}>Ceremony</span><span className="font-semibold">15:00, {WEDDING.venue}</span></div>
                <div className="flex justify-between"><span style={{ color: T.sub }}>Dietary</span><span className="font-semibold">{preview.guests.flatMap((g) => g.needs.map(([k]) => k)).join(", ") || "None noted"}</span></div>
                <button onClick={() => sendPass(preview)} disabled={!preview.tableId} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold" style={{ background: preview.tableId ? T.accent : T.panel2, color: preview.tableId ? T.onAccent : T.faint }}>
                  <Send size={12} />{!preview.tableId ? "Seat them first" : sent.has(preview.house) ? "Sent — send again" : "Send this pass"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border p-6 text-center text-xs" style={{ borderColor: T.border, color: T.faint }}>No households confirmed yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
