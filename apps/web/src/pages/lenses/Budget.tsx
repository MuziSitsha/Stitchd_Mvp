import { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { UsersRound, ShieldCheck, Scissors, Pin, PinOff, Info, Check, Bell, Gift, Plus } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba, type Theme } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { BENCH, PER_HEAD, benchStatus, fmtR, randR } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { useBudget, type BudgetItem } from "../../state/useBudget";
import type { LensKey } from "../../components/proto/AppShell";

// Evenly-spaced hue rotation — distinct-enough slices without a hardcoded
// palette that'd clash with the couple's chosen wedding palette elsewhere.
function donutColor(i: number, n: number) {
  const hue = (262 + (360 / Math.max(1, n)) * i) % 360;
  return `hsl(${hue}, 62%, 58%)`;
}

// One category card's "add a line" affordance — collapsed to a plain text
// trigger until clicked, so the 13-category list doesn't carry 13 always-open
// input rows. Cost is entered in whole Rand (what a person actually types)
// and converted to BUDGET_SEED's thousands-of-Rand unit at submit time.
function AddLine({ T, cat, onAdd }: { T: Theme; cat: string; onAdd: (label: string, costK: number) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [cost, setCost] = useState("");
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-1.5 flex items-center gap-1 text-xs font-semibold" style={{ color: T.accent }}>
        <Plus size={12} />Add a line
      </button>
    );
  }
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={`New ${cat} line…`} className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
      <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Rand" inputMode="numeric" className="w-20 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
      <button
        onClick={() => {
          const costNum = Number(cost);
          if (!label.trim() || !costNum || costNum <= 0) return;
          onAdd(label.trim(), costNum / 1000);
          setLabel(""); setCost(""); setOpen(false);
        }}
        className="rounded-lg px-2.5 py-1.5 text-xs font-bold"
        style={{ background: "#1A1726", color: "#fff" }}
      >
        Add
      </button>
    </div>
  );
}

// Ported exactly from stitchd-v9.jsx lines 1825-1899.
export function Budget({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T } = useTheme();
  const { budgetCap, setBudgetCap, pinned, setPinned, addBudgetItem, gList, headcountBase, changeReqs, toast } = useProtoState();
  const { BUDGET_ITEMS, budget } = useBudget();
  const confirmedHeads = useMemo(() => gList.filter((g) => g.rsvp !== "no").reduce((a, g) => a + g.party, 0), [gList]);
  const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };

  const pendingChanges = useMemo(() => changeReqs.filter((r) => r.status === "pending"), [changeReqs]);
  const approvedHeadExtra = useMemo(() => changeReqs.filter((r) => r.status === "approved").reduce((a, r) => a + r.amount, 0), [changeReqs]);
  const paidSum = useMemo(() => BUDGET_ITEMS.filter((b) => b.paid).reduce((a, b) => a + b.cost, 0), [BUDGET_ITEMS]);

  const budgetByCat = useMemo(() => {
    const m: Record<string, { cat: string; kept: number; dropped: number }> = {};
    BUDGET_ITEMS.forEach((b) => {
      if (!m[b.cat]) m[b.cat] = { cat: b.cat, kept: 0, dropped: 0 };
      if (budget.kept.has(b.id)) m[b.cat].kept += b.cost; else m[b.cat].dropped += b.cost;
    });
    return Object.values(m).sort((a, b) => b.kept + b.dropped - (a.kept + a.dropped));
  }, [budget, BUDGET_ITEMS]);
  const donut = useMemo(() => budgetByCat.filter((c) => c.kept > 0), [budgetByCat]);

  const spendGroups = useMemo(() => {
    const m: Record<string, { cat: string; planned: number; confirmed: number; estimated: number; items: BudgetItem[] }> = {};
    BUDGET_ITEMS.forEach((b) => {
      if (!m[b.cat]) m[b.cat] = { cat: b.cat, planned: 0, confirmed: 0, estimated: 0, items: [] };
      m[b.cat].planned += b.cost;
      if (b.paid) m[b.cat].confirmed += b.cost; else m[b.cat].estimated += b.cost;
      m[b.cat].items.push(b);
    });
    return Object.values(m)
      .map((g) => ({ ...g, items: [...g.items].sort((a, b) => b.cost - a.cost), status: benchStatus(g.planned, g.cat), bench: BENCH[g.cat] }))
      .sort((a, b) => b.planned - a.planned);
  }, [BUDGET_ITEMS]);

  const stillToPay = Math.max(0, budget.keptSum - paidSum);
  const barMax = Math.max(budget.keptSum, budgetCap) * 1.05;

  return (
    <div className="space-y-3 rise">
      <div className="grid gap-3 lg:grid-cols-[1fr_360px] lg:items-stretch">
        <div className="rounded-2xl p-5" style={{ background: "#1A1726" }}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs font-bold" style={{ color: rgba("#fff", 0.55), letterSpacing: 1 }}>BUDGET</div>
              <div className="tnum" style={{ ...bigNum, fontSize: 24, color: "#fff" }}>{fmtR(budgetCap)}</div>
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: rgba("#fff", 0.55), letterSpacing: 1 }}>COMMITTED</div>
              <div className="tnum" style={{ ...bigNum, fontSize: 24, color: "#fff" }}>{fmtR(budget.keptSum)}</div>
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: rgba("#fff", 0.55), letterSpacing: 1 }}>PAID SO FAR</div>
              <div className="tnum" style={{ ...bigNum, fontSize: 24, color: "#fff" }}>{fmtR(paidSum)}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold" style={{ color: rgba("#fff", 0.55), letterSpacing: 1 }}>HEADROOM</div>
            <div className="tnum" style={{ ...bigNum, fontSize: 26, color: budget.headroom >= 0 ? T.good : "#F0644C" }}>{fmtR(Math.abs(budget.headroom))} {budget.headroom >= 0 ? "spare" : "over"}</div>
          </div>
          <div className="relative mt-3 h-2.5 overflow-hidden rounded-full" style={{ background: rgba("#fff", 0.12) }}>
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(paidSum / barMax) * 100}%`, background: T.good }} />
            <div className="absolute inset-y-0 rounded-full" style={{ left: `${(paidSum / barMax) * 100}%`, width: `${(Math.max(0, budget.keptSum - paidSum) / barMax) * 100}%`, background: T.accent }} />
            <div className="absolute inset-y-0 w-0.5" style={{ left: `${Math.min(100, (budgetCap / barMax) * 100)}%`, background: "#fff" }} />
          </div>
          <div className="mt-2 text-xs" style={{ color: rgba("#fff", 0.65) }}>{fmtR(stillToPay)} still to pay on signed contracts</div>
          <div className="mt-3 flex items-center gap-2">
            <input type="range" min={280} max={480} step={5} value={budgetCap} onChange={(e) => setBudgetCap(Number(e.target.value))} className="flex-1" aria-label="Budget cap" />
            <span className="text-xs" style={{ color: rgba("#fff", 0.5) }}>Slide to change your cap</span>
          </div>
        </div>

        {budget.dropped.length > 0 ? (
          <Card T={T} style={{ background: rgba(T.gold, 0.1), borderColor: rgba(T.gold, 0.5) }}>
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.warn, letterSpacing: 1 }}><Scissors size={12} />{budget.dropped.length} WAY{budget.dropped.length > 1 ? "S" : ""} BACK INSIDE {fmtR(budgetCap)}</div>
            <div className="mt-2 space-y-1.5" style={{ maxHeight: 210, overflowY: "auto" }}>
              {budget.dropped.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5" style={{ background: T.panel }}>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{d.label.replace(/^[^—]*—\s*/, "")}</span>
                  <span className="tnum shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: rgba(T.warn, 0.14), color: T.warn }}>{fmtR(d.cost)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs" style={{ color: T.sub }}>All {budget.dropped.length} saves {fmtR(budget.saving)} together, back inside your line.</div>
          </Card>
        ) : (
          <Card T={T} style={{ borderColor: rgba(T.good, 0.4) }}>
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.good, letterSpacing: 1 }}><Check size={12} />INSIDE YOUR {fmtR(budgetCap)} LINE</div>
            <div className="mt-1.5 text-xs" style={{ color: T.sub }}>Nothing is deferred right now — every committed item fits under your cap with {fmtR(Math.max(0, budget.headroom))} to spare.</div>
          </Card>
        )}
      </div>

      <Card T={T} style={{ borderColor: pendingChanges.length ? rgba(T.warn, 0.5) : T.border }}>
        <div className="flex flex-wrap items-center gap-2">
          <UsersRound size={16} style={{ color: T.accent }} />
          <span className="text-sm font-bold">Per-head costs</span>
          <span className="ml-auto text-xs tnum" style={{ color: T.sub }}>
            Approved for <b style={{ color: T.ink }}>{headcountBase}</b> · now{" "}
            <b style={{ color: confirmedHeads > headcountBase ? T.warn : T.good }}>{confirmedHeads} confirmed</b>
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
          {Object.entries(PER_HEAD).map(([role, ph]) => (
            <div key={role} className="min-w-0 rounded-xl p-2" style={{ background: T.panel2 }}>
              <div className="tnum truncate" style={{ ...bigNum, fontSize: 15 }}>{randR(ph)}</div>
              <div className="truncate text-xs" style={{ color: T.sub }}>{role} /head</div>
            </div>
          ))}
        </div>
        {approvedHeadExtra > 0 && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg p-2 text-xs" style={{ background: rgba(T.good, 0.1), color: T.good }}>
            <Check size={12} />Approved headcount increases have added <b>{randR(approvedHeadExtra)}</b> to committed spend.
          </div>
        )}
        {pendingChanges.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg p-2 text-xs" style={{ background: rgba(T.warn, 0.12), color: T.warn }}>
            <Bell size={12} />{pendingChanges.length} supplier change{pendingChanges.length > 1 ? "s" : ""} awaiting sign-off ({randR(pendingChanges.reduce((a, r) => a + r.amount, 0))}).{" "}
            <button onClick={() => setLens("seating")} className="font-bold underline">Review</button>
          </div>
        )}
        {budget.saving > 0 && (
          <div className="mt-2 flex items-center gap-2 rounded-xl p-2 text-xs font-semibold" style={{ background: rgba(T.gold, 0.1), color: T.gold }}>
            <Gift size={13} />Oakfield package saving R71k applied to committed spend.
          </div>
        )}
      </Card>

      <div className="grid gap-3 lg:grid-cols-[340px_1fr] lg:items-start">
        <Card T={T}>
          <div className="mb-1 text-sm font-bold">Where the money goes</div>
          <div className="mb-2 text-xs" style={{ color: T.sub }}>Committed spend, by category</div>
          <div className="flex flex-col items-center gap-3">
            <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donut} dataKey="kept" nameKey="cat" innerRadius={50} outerRadius={78} paddingAngle={1.5} stroke="none" startAngle={90} endAngle={-270}>
                    {donut.map((d, i) => <Cell key={d.cat} fill={donutColor(i, donut.length)} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmtR(Number(v))} contentStyle={{ background: T.tipBg, border: `1px solid ${T.border}`, borderRadius: 10, color: T.ink, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs" style={{ color: T.faint, letterSpacing: 1 }}>COMMITTED</span>
                <span style={{ ...bigNum, fontSize: 17 }}>{fmtR(budget.keptSum)}</span>
              </div>
            </div>
            <div className="flex min-w-0 w-full flex-col gap-1">
              {donut.map((d, i) => (
                <div key={d.cat} className="flex w-full items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: donutColor(i, donut.length) }} />
                  <span className="min-w-0 flex-1 truncate">{d.cat}</span>
                  <span className="tnum shrink-0 font-bold">{fmtR(d.kept)}</span>
                  <span className="shrink-0" style={{ color: T.faint, width: 32, textAlign: "right" }}>{Math.round((d.kept / (budget.keptSum || 1)) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          <div className="flex items-center gap-2 px-0.5">
            <span style={{ ...bigNum, fontSize: 12, letterSpacing: 1, color: T.sub }}>SPEND BY CATEGORY</span>
            <span className="text-xs" style={{ color: T.faint }}>highest first · benchmarks are Gauteng estimates</span>
          </div>
          {/* 2-up grid, not a single stacked column — 13 categories in one
              column pushed this screen well past a full scroll on desktop. */}
          <div className="grid gap-2 sm:grid-cols-2">
          {spendGroups.map((g) => {
            const sc = { good: T.good, warn: T.warn, bad: T.bad, info: T.info, faint: T.faint }[g.status.c];
            return (
              <Card key={g.cat} T={T} className="!p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span style={{ ...bigNum, fontSize: 15 }}>{g.cat}</span>
                  <span className="tnum" style={{ ...bigNum, fontSize: 15, color: T.gold }}>{fmtR(g.planned)}</span>
                  <span className="ml-auto rounded-full px-2 py-0.5" style={{ fontSize: 10, fontWeight: 800, background: rgba(sc, 0.14), color: sc }}>{g.status.label}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs" style={{ color: T.sub }}>
                  <span className="tnum"><b style={{ color: T.good }}>{fmtR(g.confirmed)}</b> confirmed</span>
                  <span className="tnum"><b style={{ color: T.warn }}>{fmtR(g.estimated)}</b> estimated</span>
                  {g.bench && <span className="tnum">typical <b style={{ color: T.ink }}>{fmtR(g.bench[0])}–{fmtR(g.bench[1])}</b></span>}
                </div>
                {g.bench && (() => {
                  const max = Math.max(g.planned, g.bench[1]) * 1.1;
                  return (
                    <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full" style={{ background: rgba(T.ink, 0.08) }}>
                      <div className="absolute inset-y-0 rounded-full" style={{ left: `${(g.bench![0] / max) * 100}%`, width: `${((g.bench![1] - g.bench![0]) / max) * 100}%`, background: rgba(T.good, 0.25) }} />
                      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(g.planned / max) * 100}%`, background: sc }} />
                    </div>
                  );
                })()}
                <details className="mt-1.5 group">
                  <summary className="cursor-pointer text-xs font-semibold" style={{ color: T.accent }}>
                    {g.items.length} line{g.items.length > 1 ? "s" : ""} <span className="group-open:hidden">— show</span><span className="hidden group-open:inline">— hide</span>
                  </summary>
                  <div className="mt-1.5 grid gap-1.5">
                    {g.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: T.panel2, opacity: budget.kept.has(it.id) ? 1 : 0.65 }}>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: it.paid ? T.good : budget.kept.has(it.id) ? T.warn : T.faint }} title={it.paid ? "confirmed" : "estimated"} />
                        <span className="min-w-0 flex-1 truncate text-xs">{it.label.replace(/^[^—]*—\s*/, "")}</span>
                        {it.paid && <ShieldCheck size={11} style={{ color: T.good }} />}
                        {!budget.kept.has(it.id) && <Scissors size={10} style={{ color: T.warn }} />}
                        <span className="tnum shrink-0 text-xs font-bold">{fmtR(it.cost)}</span>
                        {!it.paid && (
                          <button
                            aria-label="pin"
                            onClick={() => {
                              const willPin = !pinned.has(it.id);
                              setPinned((p) => { const n = new Set(p); if (n.has(it.id)) n.delete(it.id); else n.add(it.id); return n; });
                              if (willPin) toast("Pinned — never auto-deferred");
                            }}
                            style={{ color: pinned.has(it.id) ? T.info : T.faint }}
                          >
                            {pinned.has(it.id) ? <PinOff size={12} /> : <Pin size={12} />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
                <AddLine T={T} cat={g.cat} onAdd={(label, costK) => addBudgetItem(g.cat, label, costK)} />
              </Card>
            );
          })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs" style={{ color: T.faint }}>
        <Info size={11} />● confirmed &nbsp; ● estimated (kept at cap) &nbsp; ● deferred. Typical ranges are market estimates, not quotes.
      </div>
    </div>
  );
}
