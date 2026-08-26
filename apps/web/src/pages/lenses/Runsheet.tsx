import { useMemo } from "react";
import { Send, CloudRain, Zap } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { WEDDING, RUNSHEET_SEED } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { WEATHER } from "./Today";

// Us > The day — the run sheet is net-new seed content (RUNSHEET_SEED,
// data.ts) built from the app's real supplier names, but each row's status
// chip is derived live from the real `sup` list (confirmed/pending/issue)
// rather than a second, static flag — so if Taste Affair's date clash
// resolves in Suppliers, this screen reflects it too.
export function Runsheet() {
  const { T } = useTheme();
  const { sup, toast, setMsgs } = useProtoState();

  const rows = useMemo(
    () => RUNSHEET_SEED.map((r) => ({ ...r, s: sup.find((x) => r.owner.includes(x.name) || x.name.includes(r.owner)) })),
    [sup],
  );
  const flagged = rows.filter((r) => r.s?.status === "issue");

  function sendToAll() {
    toast(`Run sheet sent to ${new Set(RUNSHEET_SEED.map((r) => r.owner)).size} suppliers`);
    setMsgs((m) => [...m, { who: "Lungi", t: new Date().toTimeString().slice(0, 5), m: "Run sheet's out to everyone with a role on the day — I'll flag it here the moment someone hasn't opened it." }]);
  }

  return (
    <div className="rise grid gap-3 lg:grid-cols-[1fr_280px] lg:items-start">
      <div className="space-y-3">
        <div className="rounded-2xl border p-4" style={{ borderColor: T.border, background: "#1A1726" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold" style={{ color: "#fff" }}>Your Saturday, hour by hour</div>
              <div className="text-xs" style={{ color: rgba("#fff", 0.7) }}>{RUNSHEET_SEED[0].time} to {RUNSHEET_SEED[RUNSHEET_SEED.length - 1].time} · every supplier sees the same sheet</div>
            </div>
            <button onClick={sendToAll} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#F2C14E", color: "#3A2A05" }}><Send size={12} />Send to all nine</button>
          </div>
          {flagged.length > 0 && <div className="mt-2 text-xs font-semibold" style={{ color: "#F0644C" }}>{flagged.length} moment{flagged.length > 1 ? "s" : ""} rest on a supplier with an open issue — flagged below in red.</div>}
        </div>

        <Card T={T} className="!p-0 overflow-hidden">
          {rows.map((r, i) => {
            const flag = r.s?.status === "issue";
            return (
              <div key={r.time} className="grid items-center gap-2 px-4 py-3 text-xs sm:grid-cols-[64px_1fr_170px]" style={{ borderTop: i ? `1px solid ${T.border}` : undefined }}>
                <span className="tnum font-extrabold" style={{ color: flag ? T.bad : T.faint }}>{r.time}</span>
                <div className="min-w-0">
                  <div className="font-bold">{r.what}</div>
                  <div className="text-[11px]" style={{ color: T.sub }}>{r.detail}</div>
                </div>
                <span className="w-fit shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:justify-self-end" style={{ background: rgba(flag ? T.bad : T.accent, 0.14), color: flag ? T.bad : T.accent }}>{r.owner}</span>
              </div>
            );
          })}
        </Card>
      </div>

      <div className="space-y-3">
        <Card T={T}>
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}><CloudRain size={12} />WHERE YOU'LL ACTUALLY BE</div>
          <div className="mt-1.5 text-xs leading-relaxed" style={{ color: T.sub }}>You've got 40 uninterrupted minutes together at 17:45 — golden hour, {WEATHER.rain}% rain chance for the day. It's the only real gap that's just the two of you.</div>
        </Card>
        <Card T={T} style={{ background: rgba(T.warn, 0.1), borderColor: rgba(T.warn, 0.4) }}>
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.warn, letterSpacing: 1 }}><Zap size={12} />ONE RISK IN THE DAY</div>
          <div className="mt-1.5 text-xs leading-relaxed" style={{ color: T.ink }}>Load-shedding could cut power mid-afternoon, through set-up and the start of dinner. {WEDDING.venue.split(",")[0]}'s generator covers the hall, not the marquee lighting.</div>
        </Card>
      </div>
    </div>
  );
}
