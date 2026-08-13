import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { UsersRound, ShieldCheck, Scissors, Pin, PinOff, Info, Check, Bell, Gift } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { BENCH, PER_HEAD, benchStatus, fmtR, randR } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { useBudget, type BudgetItem } from "../../state/useBudget";
import type { LensKey } from "../../components/proto/AppShell";

// Ported exactly from stitchd-v9.jsx lines 1825-1899.
export function Budget({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T } = useTheme();
  const { budgetCap, setBudgetCap, pinned, setPinned, gList, headcountBase, changeReqs, toast } = useProtoState();
  const { BUDGET_ITEMS, budget } = useBudget();
  const confirmedHeads = useMemo(() => gList.filter((g) => g.rsvp !== "no").reduce((a, g) => a + g.party, 0), [gList]);
  const bigNum = { fontFamily: "'Archivo Black',sans-serif", lineHeight: 1, fontVariantNumeric: "tabular-nums" as const };

  const pendingChanges = useMemo(() => changeReqs.filter((r) => r.status === "pending"), [changeReqs]);
  const approvedHeadExtra = useMemo(() => changeReqs.filter((r) => r.status === "approved").reduce((a, r) => a + r.amount, 0), [changeReqs]);

  const budgetByCat = useMemo(() => {
    const m: Record<string, { cat: string; kept: number; dropped: number }> = {};
    BUDGET_ITEMS.forEach((b) => {
      if (!m[b.cat]) m[b.cat] = { cat: b.cat, kept: 0, dropped: 0 };
      if (budget.kept.has(b.id)) m[b.cat].kept += b.cost; else m[b.cat].dropped += b.cost;
    });
    return Object.values(m).sort((a, b) => b.kept + b.dropped - (a.kept + a.dropped));
  }, [budget, BUDGET_ITEMS]);

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

  return (
    <div className="space-y-3 rise">
      <Card T={T} style={{ borderColor: pendingChanges.length ? rgba(T.warn, 0.5) : T.border }}>
        <div className="flex flex-wrap items-center gap-2">
          <UsersRound size={16} style={{ color: T.accent }} />
          <span className="text-sm font-bold">Per-head costs</span>
          <span className="ml-auto text-xs tnum" style={{ color: T.sub }}>
            Approved for <b style={{ color: T.ink }}>{headcountBase}</b> · now{" "}
            <b style={{ color: confirmedHeads > headcountBase ? T.warn : T.good }}>{confirmedHeads} confirmed</b>
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {Object.entries(PER_HEAD).map(([role, ph]) => (
            <div key={role} className="rounded-xl p-2" style={{ background: T.panel2 }}>
              <div className="tnum" style={{ ...bigNum, fontSize: 15 }}>{randR(ph)}</div>
              <div className="text-xs" style={{ color: T.sub }}>{role} /head</div>
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
      </Card>

      <Card T={T}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-sm font-bold">Budget cap</div>
            <div className="text-xs" style={{ color: T.sub }}>Slide it — the optimizer protects high-need items and defers the least-needed first.</div>
          </div>
          <div style={{ ...bigNum, fontSize: 28, color: T.gold }}>{fmtR(budgetCap)}</div>
        </div>
        <input type="range" min={280} max={480} step={5} value={budgetCap} onChange={(e) => setBudgetCap(Number(e.target.value))} className="mt-3 w-full" aria-label="Budget cap" />
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {[
            { l: "Committed", v: fmtR(budget.keptSum), c: T.ink },
            { l: "Headroom", v: fmtR(Math.max(0, budget.headroom)), c: budget.headroom >= 15 ? T.good : budget.headroom >= 0 ? T.warn : T.bad },
            { l: "Deferred", v: budget.dropped.length ? fmtR(budget.dropped.reduce((s, d) => s + d.cost, 0)) : "R0", c: budget.dropped.length ? T.warn : T.faint },
          ].map((k) => (
            <div key={k.l} className="rounded-xl p-2" style={{ background: T.panel2 }}>
              <div style={{ ...bigNum, fontSize: 17, color: k.c }}>{k.v}</div>
              <div className="text-xs" style={{ color: T.sub }}>{k.l}</div>
            </div>
          ))}
        </div>
        {budget.saving > 0 && (
          <div className="mt-2 flex items-center gap-2 rounded-xl p-2 text-xs font-semibold" style={{ background: rgba(T.gold, 0.1), color: T.gold }}>
            <Gift size={13} />Oakfield package saving R71k applied to committed spend.
          </div>
        )}
      </Card>

      <Card T={T}>
        <div className="mb-1 text-sm font-bold">Spend by category</div>
        <div className="mb-2 text-xs" style={{ color: T.sub }}>Violet = committed · amber = auto-deferred at current cap</div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={budgetByCat} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={T.grid} vertical={false} />
              <XAxis dataKey="cat" tick={{ fill: T.sub, fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fill: T.faint, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmtR(Number(v))} cursor={{ fill: rgba(T.accent, 0.06) }} contentStyle={{ background: T.tipBg, border: `1px solid ${T.border}`, borderRadius: 10, color: T.ink, fontSize: 12 }} />
              <Bar dataKey="kept" stackId="a" fill={T.accent} />
              <Bar dataKey="dropped" stackId="a" fill={rgba(T.warn, 0.55)} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="flex items-center gap-2 px-0.5">
        <span style={{ ...bigNum, fontSize: 12, letterSpacing: 1, color: T.sub }}>SPEND BY CATEGORY</span>
        <span className="text-xs" style={{ color: T.faint }}>highest first · benchmarks are Gauteng estimates</span>
      </div>
      {spendGroups.map((g) => {
        const sc = { good: T.good, warn: T.warn, bad: T.bad, info: T.info, faint: T.faint }[g.status.c];
        return (
          <Card key={g.cat} T={T}>
            <div className="flex flex-wrap items-center gap-2">
              <span style={{ ...bigNum, fontSize: 16 }}>{g.cat}</span>
              <span className="tnum" style={{ ...bigNum, fontSize: 16, color: T.gold }}>{fmtR(g.planned)}</span>
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
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
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
          </Card>
        );
      })}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: T.faint }}>
        <Info size={11} />● confirmed &nbsp; ● estimated (kept at cap) &nbsp; ● deferred. Typical ranges are market estimates, not quotes.
      </div>
    </div>
  );
}
