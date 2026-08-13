import { useState } from "react";
import { UsersRound, Plus, Zap, ArrowLeftRight, Check, AlertTriangle, Info, Bell, ShieldCheck, X } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Chip } from "../../components/proto/Chip";
import { Face } from "../../components/proto/Face";
import { REL_GROUPS, REL_SHORT, SEAT_CAP, randR } from "../../components/proto/data";
import { useProtoState, type Guest } from "../../state/ProtoState";

const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };
const btnA = (accent: string, onAccent: string) => ({ background: accent, color: onAccent });
const relMetaFor = (T: { warn: string; info: string }) => (g: Guest) => ({
  label: REL_SHORT[g.rel],
  col: g.rel.startsWith("Bride") ? "#D98A9A" : g.rel.startsWith("Groom") ? "#6C93CC" : g.child ? T.warn : T.info,
});

// Ported exactly from stitchd-v9.jsx lines 2008-2165.
export function Seating() {
  const { T } = useTheme();
  const {
    gList, setGList, tables, setTables, toast,
    changeReqs, headcountBase, raiseChangeReqs, resolveChange,
  } = useProtoState();
  const [seatSel, setSeatSel] = useState("T1");
  const [seatQ, setSeatQ] = useState("");
  const [seatRel, setSeatRel] = useState("all");
  const [dragG, setDragG] = useState<string | null>(null);
  const [dropTbl, setDropTbl] = useState<string | null>(null);
  const [seatHist, setSeatHist] = useState<{ id: string; table: string | null }[][]>([]);
  const [seatSaved, setSeatSaved] = useState(true);
  const [addName, setAddName] = useState("");
  const addRel = "Groom's friends";

  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const relMeta = relMetaFor(T);

  const confirmedHeads = gList.filter((g) => g.rsvp !== "no").reduce((a, g) => a + g.party, 0);

  function seatSnapshot() {
    setSeatHist((h) => [...h.slice(-19), gList.map((g) => ({ id: g.id, table: g.table }))]);
    setSeatSaved(false);
  }
  function tableSeats(tid: string) {
    return gList.filter((g) => g.table === tid && g.rsvp !== "no").reduce((a, g) => a + g.party, 0);
  }
  function seatGuest(gid: string, tid: string) {
    const g = gList.find((x) => x.id === gid);
    if (!g) return;
    const tbl = tables.find((t) => t.id === tid);
    if (tbl?.locked) { toast(`${tbl.name} is locked — unlock to change it`, "warn"); return; }
    if (g.table === tid) return;
    seatSnapshot();
    setGList((gs) => gs.map((x) => (x.id === gid ? { ...x, table: tid } : x)));
    if (tid && tbl) {
      const after = tableSeats(tid) + (g.table === tid ? 0 : g.party);
      if (after > tbl.cap) toast(`${tbl.name} now over capacity (${after}/${tbl.cap})`, "warn");
    }
  }
  function unseat(gid: string) {
    seatSnapshot();
    setGList((gs) => gs.map((x) => (x.id === gid ? { ...x, table: null } : x)));
  }
  function addTable() {
    const n = tables.length + 1;
    const id = `T${Date.now()}`;
    setTables((ts) => [...ts, { id, name: `Table ${n}`, cap: SEAT_CAP, locked: false }]);
    setSeatSel(id);
    setSeatSaved(false);
    toast(`Table ${n} added`);
  }
  function delTable(tid: string) {
    const seated = gList.filter((g) => g.table === tid);
    seatSnapshot();
    setGList((gs) => gs.map((x) => (x.table === tid ? { ...x, table: null } : x)));
    setTables((ts) => ts.filter((t) => t.id !== tid));
    setSeatSel((s) => (s === tid ? "" : s));
    toast(seated.length ? `Table removed · ${seated.length} guest${seated.length > 1 ? "s" : ""} returned to unassigned` : "Table removed", "warn");
  }
  function renameTable(tid: string, name: string) {
    setTables((ts) => ts.map((t) => (t.id === tid ? { ...t, name } : t)));
    setSeatSaved(false);
  }
  function setTableCap(tid: string, cap: number) {
    setTables((ts) => ts.map((t) => (t.id === tid ? { ...t, cap: Math.max(2, Math.min(14, cap)) } : t)));
    setSeatSaved(false);
  }
  function lockTable(tid: string) {
    setTables((ts) => ts.map((t) => (t.id === tid ? { ...t, locked: !t.locked } : t)));
  }
  function seatUndo() {
    if (!seatHist.length) return;
    const prev = seatHist[seatHist.length - 1];
    const map = Object.fromEntries(prev.map((p) => [p.id, p.table]));
    setGList((gs) => gs.map((g) => (g.id in map ? { ...g, table: map[g.id] } : g)));
    setSeatHist((h) => h.slice(0, -1));
    toast("Seating change undone");
  }
  function saveSeating() {
    setSeatSaved(true);
    setSeatHist([]);
    toast("Seating plan saved ✓");
  }
  function autoSeat() {
    seatSnapshot();
    setGList((gs) => {
      const next = gs.map((g) => ({ ...g }));
      const cap = Object.fromEntries(tables.map((t) => [t.id, t.cap]));
      const load: Record<string, number> = Object.fromEntries(tables.map((t) => [t.id, next.filter((g) => g.table === t.id && g.rsvp !== "no").reduce((a, g) => a + g.party, 0)]));
      const houses: Record<string, typeof next> = {};
      next.filter((g) => !g.table && g.rsvp !== "no").forEach((g) => { (houses[g.house] = houses[g.house] || []).push(g); });
      Object.values(houses).forEach((members) => {
        const need = members.reduce((a, g) => a + g.party, 0);
        const tbl = tables.filter((t) => !t.locked).find((t) => cap[t.id] - load[t.id] >= need);
        if (tbl) { members.forEach((g) => { g.table = tbl.id; }); load[tbl.id] += need; }
      });
      return next;
    });
    toast("Households auto-seated where they fit — review and adjust");
  }
  function addGuest() {
    const nm = addName.trim();
    if (!nm) { toast("Type a name first", "warn"); return; }
    const id = "gx" + Date.now();
    const guest: Guest = { id, name: nm, rel: addRel, house: nm.split(" ")[0] + " household", rsvp: "yes", party: 1, ph: "27820000000", em: "", table: null, needs: [], child: false, rem: 0, remAt: null };
    setGList((gs) => [...gs, guest]);
    setAddName("");
    toast(`${nm} added — checking supplier impact…`);
    setTimeout(() => raiseChangeReqs(), 40);
  }

  const attending = gList.filter((g) => g.rsvp !== "no");
  const unseated = attending
    .filter((g) => !g.table)
    .filter((g) => seatRel === "all" || g.rel === seatRel)
    .filter((g) => seatQ === "" || `${g.name} ${g.house} ${REL_SHORT[g.rel]}`.toLowerCase().includes(seatQ.toLowerCase()));
  const unseatedSeats = attending.filter((g) => !g.table).reduce((a, g) => a + g.party, 0);
  const sel = tables.find((t) => t.id === seatSel);

  const warnings: { sev: "high" | "med"; msg: string; go: (() => void) | null }[] = [];
  tables.forEach((t) => {
    const seats = tableSeats(t.id);
    if (seats > t.cap) warnings.push({ sev: "high", msg: `${t.name} is over capacity (${seats}/${t.cap})`, go: () => setSeatSel(t.id) });
  });
  const houseTables: Record<string, Set<string>> = {};
  attending.filter((g) => g.table).forEach((g) => { (houseTables[g.house] = houseTables[g.house] || new Set()).add(g.table!); });
  Object.entries(houseTables).forEach(([h, set]) => { if (set.size > 1) warnings.push({ sev: "med", msg: `Household "${h}" is split across ${set.size} tables`, go: null }); });
  tables.forEach((t) => {
    const at = gList.filter((g) => g.table === t.id);
    const kids = at.filter((g) => g.child), adults = at.filter((g) => !g.child);
    if (kids.length && !adults.length) warnings.push({ sev: "med", msg: `${t.name} has children with no adult`, go: () => setSeatSel(t.id) });
  });

  const pendingChanges = changeReqs.filter((r) => r.status === "pending");

  return (
    <div className="rise">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div>
          <div style={{ ...bigNum, fontSize: 18 }}>SEATING PLAN</div>
          <div className="text-xs" style={{ color: T.sub }}>{attending.length - unseated.length} seated · {unseatedSeats} still to place · tables of {SEAT_CAP}</div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button onClick={autoSeat} className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold press" style={btnG}><Zap size={12} />Auto-seat households</button>
          <button onClick={seatUndo} disabled={!seatHist.length} className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold" style={{ ...btnG, opacity: seatHist.length ? 1 : 0.5 }}><ArrowLeftRight size={12} />Undo</button>
          <button onClick={addTable} className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold press" style={btnG}><Plus size={12} />Add table</button>
          <button onClick={saveSeating} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold press" style={seatSaved ? { background: rgba(T.good, 0.15), color: T.good } : btnA(T.accent, T.onAccent)}>
            {seatSaved ? <><Check size={12} />Saved</> : <>Save plan</>}
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {warnings.slice(0, 4).map((w, i) => (
            <button key={i} onClick={w.go || undefined} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs" style={{ background: rgba(w.sev === "high" ? T.bad : T.warn, 0.12), color: w.sev === "high" ? T.bad : T.warn, cursor: w.go ? "pointer" : "default" }}>
              <AlertTriangle size={11} />{w.msg}
            </button>
          ))}
          <span className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs" style={{ color: T.faint }}><Info size={11} />suggestions only — you decide</span>
        </div>
      )}

      {pendingChanges.length > 0 && (
        <Card T={T} className="mb-3" style={{ borderColor: rgba(T.warn, 0.5), background: rgba(T.warn, 0.06) }}>
          <div className="flex items-center gap-2"><Bell size={15} style={{ color: T.warn }} /><span className="text-sm font-bold">Headcount changed — supplier sign-off needed</span></div>
          <div className="mt-1 text-xs" style={{ color: T.sub }}>You're now at <b style={{ color: T.ink }}>{confirmedHeads} confirmed</b> (approved for {headcountBase}). These suppliers charge per head, so the change is material — they approve, then it flows to your budget.</div>
          <div className="mt-2 space-y-1.5">
            {pendingChanges.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg p-2" style={{ background: T.panel2 }}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{r.sup}</div>
                  <div className="text-xs tnum" style={{ color: T.sub }}>+{r.delta} guests × {randR(r.perHead)}/head = <b style={{ color: T.gold }}>{randR(r.amount)}</b></div>
                </div>
                <button onClick={() => resolveChange(r.id, true)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold press" style={{ background: rgba(T.good, 0.15), color: T.good }}>Approve</button>
                <button onClick={() => resolveChange(r.id, false)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ background: rgba(T.bad, 0.12), color: T.bad }}>Decline</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <Card T={T}>
            <div className="mb-2 flex items-center gap-1.5">
              <UsersRound size={14} style={{ color: T.accent }} />
              <span className="text-sm font-bold">Unassigned</span>
              <span className="ml-auto rounded-full px-1.5 py-0.5 tnum" style={{ fontSize: 10, fontWeight: 800, background: rgba(T.warn, 0.14), color: T.warn }}>{unseatedSeats} seats</span>
            </div>
            <input value={seatQ} onChange={(e) => setSeatQ(e.target.value)} placeholder="Search guest / household…" className="mb-1.5 w-full rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
            <div className="mb-2 flex gap-1">
              <input value={addName} onChange={(e) => setAddName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGuest()} placeholder="Add a guest…" className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-xs outline-none" style={inputS} />
              <button onClick={addGuest} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold press" style={btnA(T.accent, T.onAccent)}><Plus size={12} />Add</button>
            </div>
            <select value={seatRel} onChange={(e) => setSeatRel(e.target.value)} className="mb-2 w-full rounded-lg px-2 py-1.5 text-xs" style={inputS}>
              <option value="all">All relationships</option>
              {REL_GROUPS.map((r) => <option key={r} value={r}>{REL_SHORT[r]}</option>)}
            </select>
            <div className="space-y-1.5" style={{ maxHeight: 460, overflowY: "auto" }} onDragOver={(e) => e.preventDefault()} onDrop={() => dragG && unseat(dragG)}>
              {unseated.map((g) => {
                const m = relMeta(g);
                return (
                  <div key={g.id} draggable onDragStart={() => setDragG(g.id)} onDragEnd={() => setDragG(null)} className="press flex cursor-grab items-center gap-2 rounded-lg border p-1.5" style={{ borderColor: T.border, background: T.panel2 }}>
                    <Face seed={g.id} T={T} size={28} name={g.name} tone={m.col} ring={rgba(m.col, 0.6)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{g.name}</div>
                      <div className="truncate" style={{ fontSize: 9.5, color: m.col }}>{m.label}{g.party > 1 ? ` · ${g.party}` : ""}{g.child ? " · child" : ""}</div>
                    </div>
                    <select value="" onChange={(e) => e.target.value && seatGuest(g.id, e.target.value)} className="rounded px-1 py-1 text-xs" style={{ ...inputS, fontSize: 10 }} aria-label={`Seat ${g.name}`}>
                      <option value="">Seat…</option>
                      {tables.filter((t) => !t.locked).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                );
              })}
              {unseated.length === 0 && <div className="py-6 text-center text-xs" style={{ color: T.good }}>Everyone matching is seated {"\u{1F389}"}</div>}
            </div>
          </Card>
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tables.map((t) => {
              const at = gList.filter((g) => g.table === t.id);
              const seats = tableSeats(t.id);
              const over = seats > t.cap;
              const active = dropTbl === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSeatSel(t.id)}
                  onDragOver={(e) => { e.preventDefault(); setDropTbl(t.id); }}
                  onDragLeave={() => setDropTbl((d) => (d === t.id ? null : d))}
                  onDrop={() => { if (dragG) seatGuest(dragG, t.id); setDropTbl(null); setDragG(null); }}
                  className="press cursor-pointer rounded-2xl border p-3"
                  style={{ background: T.panel, borderColor: seatSel === t.id ? T.accent : active ? T.accent : over ? rgba(T.bad, 0.6) : T.border, borderWidth: seatSel === t.id || active ? 2 : 1, boxShadow: active ? `0 0 0 3px ${rgba(T.accent, 0.2)}` : "none" }}
                >
                  <div className="mb-2 flex items-center gap-1.5">
                    {t.locked && <ShieldCheck size={12} style={{ color: T.good }} />}
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{t.name}</span>
                    <span className="tnum rounded-full px-1.5 py-0.5" style={{ fontSize: 10, fontWeight: 800, background: rgba(over ? T.bad : seats === t.cap ? T.good : T.ink, 0.12), color: over ? T.bad : seats === t.cap ? T.good : T.sub }}>{seats}/{t.cap}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: t.cap }).map((_, i) => {
                      const occupant = at[i];
                      return occupant ? (
                        <div key={i} title={occupant.name} className="relative aspect-square overflow-hidden rounded-full" style={{ border: `1.5px solid ${rgba(relMeta(occupant).col, 0.7)}` }}>
                          <Face seed={occupant.id} T={T} size={40} name={occupant.name} tone={relMeta(occupant).col} />
                        </div>
                      ) : (
                        <div key={i} className="flex aspect-square items-center justify-center rounded-full border border-dashed" style={{ borderColor: rgba(T.faint, 0.5) }}><Plus size={11} style={{ color: T.faint }} /></div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="truncate text-xs" style={{ color: T.faint }}>{at.length ? at.slice(0, 2).map((g) => g.name.split(" ")[0]).join(", ") + (at.length > 2 ? ` +${at.length - 2}` : "") : "empty"}</span>
                    <button onClick={(e) => { e.stopPropagation(); lockTable(t.id); }} className="rounded px-1.5 py-0.5 text-xs font-bold" style={{ color: t.locked ? T.good : T.faint }}>{t.locked ? "Locked" : "Lock"}</button>
                  </div>
                </div>
              );
            })}
            <button onClick={addTable} className="press flex min-h-[160px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed" style={{ borderColor: rgba(T.accent, 0.4), color: T.accent }}>
              <Plus size={22} /><span className="text-xs font-bold">Add table of {SEAT_CAP}</span>
            </button>
          </div>
        </div>

        <div>
          {sel ? (
            <Card T={T}>
              <input value={sel.name} onChange={(e) => renameTable(sel.id, e.target.value)} className="mb-2 w-full rounded-lg px-2 py-1.5 text-sm font-bold outline-none" style={inputS} aria-label="Table name" />
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span style={{ color: T.sub }}>Capacity</span>
                <button onClick={() => setTableCap(sel.id, sel.cap - 1)} className="rounded px-2 py-0.5 font-bold" style={btnG}>−</button>
                <span className="tnum font-bold" style={{ minWidth: 18, textAlign: "center" }}>{sel.cap}</span>
                <button onClick={() => setTableCap(sel.id, sel.cap + 1)} className="rounded px-2 py-0.5 font-bold" style={btnG}>+</button>
                <span className="tnum ml-auto" style={{ color: tableSeats(sel.id) > sel.cap ? T.bad : T.faint }}>{tableSeats(sel.id)} filled</span>
              </div>
              {(() => {
                const at = gList.filter((g) => g.table === sel.id);
                const byRel: Record<string, number> = {};
                at.forEach((g) => { byRel[relMeta(g).label] = (byRel[relMeta(g).label] || 0) + 1; });
                const diet: Record<string, number> = {};
                at.forEach((g) => g.needs.forEach(([k, n]) => { diet[k] = (diet[k] || 0) + n; }));
                return (
                  <>
                    <div className="mb-1 text-xs font-bold" style={{ color: T.sub }}>Guests</div>
                    <div className="space-y-1" style={{ maxHeight: 240, overflowY: "auto" }}>
                      {at.map((g) => {
                        const m = relMeta(g);
                        return (
                          <div key={g.id} className="flex items-center gap-1.5 rounded-lg p-1" style={{ background: T.panel2 }}>
                            <Face seed={g.id} T={T} size={24} name={g.name} tone={m.col} />
                            <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{g.name}</div><div className="truncate" style={{ fontSize: 9, color: m.col }}>{m.label}</div></div>
                            <button onClick={() => unseat(g.id)} aria-label={`Remove ${g.name}`} className="rounded p-0.5" style={{ color: T.faint }}><X size={12} /></button>
                          </div>
                        );
                      })}
                      {at.length === 0 && <div className="py-3 text-center text-xs" style={{ color: T.faint }}>Empty — drag guests here</div>}
                    </div>
                    {Object.keys(byRel).length > 0 && (
                      <div className="mt-2">
                        <div className="mb-1 text-xs font-bold" style={{ color: T.sub }}>Relationship balance</div>
                        <div className="flex flex-wrap gap-1">{Object.entries(byRel).map(([r, n]) => <Chip key={r} c={T.info} T={T}>{r} {n}</Chip>)}</div>
                      </div>
                    )}
                    {Object.keys(diet).length > 0 && (
                      <div className="mt-2">
                        <div className="mb-1 text-xs font-bold" style={{ color: T.sub }}>Dietary</div>
                        <div className="flex flex-wrap gap-1">{Object.entries(diet).map(([k, n]) => <Chip key={k} c={T.warn} T={T}>{k} {n}</Chip>)}</div>
                      </div>
                    )}
                  </>
                );
              })()}
              <div className="mt-3 flex gap-1.5">
                <button onClick={() => lockTable(sel.id)} className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold" style={sel.locked ? { background: rgba(T.good, 0.15), color: T.good } : btnG}>
                  <ShieldCheck size={12} />{sel.locked ? "Locked" : "Lock table"}
                </button>
                <button onClick={() => delTable(sel.id)} className="rounded-lg px-2.5 py-2 text-xs font-bold" style={{ background: rgba(T.bad, 0.12), color: T.bad }}><X size={12} /></button>
              </div>
            </Card>
          ) : (
            <Card T={T} className="text-center text-xs" style={{ color: T.sub }}>Select a table to see its guests.</Card>
          )}
        </div>
      </div>
    </div>
  );
}
