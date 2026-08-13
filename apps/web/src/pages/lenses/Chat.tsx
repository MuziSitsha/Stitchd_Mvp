import { useEffect, useRef, useState } from "react";
import { Send, ArrowRight } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { PALETTES } from "../../theme/palettes";
import { Card } from "../../components/proto/Card";
import { Chip } from "../../components/proto/Chip";
import { Face } from "../../components/proto/Face";
import { RSVP_DAYS, fmtR } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { useReadiness } from "../../state/useReadiness";
import type { LensKey } from "../../components/proto/AppShell";

const WEATHER_RAIN = 55;

// Ported exactly from stitchd-v9.jsx lines 2493-2519. The reply logic
// (stitchd-v9.jsx lines 1436-1468) references the Supplier and Readiness
// drawers, which aren't ported yet — those actions route to the closest
// real lens (Suppliers / Squad) instead.
export function Chat({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T, pal } = useTheme();
  const { sup, budgetCap, bundleApplied, msgs, setMsgs, chaseRsvp, applyBundle, guests, profile, setSelSup, setReadyOpen } = useProtoState();
  const { coreList, rsvp, budget, pRoles, WEIGHTS, R, sug } = useReadiness(setLens);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

  type Reply = { m: string; act: { l: string; go: () => void } | null };
  function lungiReply(text: string): Reply {
    const q = text.toLowerCase();
    const issues = sup.filter((s) => s.status === "issue");
    const unconf = coreList.filter((s) => s.status !== "confirmed");
    if (/rain|weather|tent|marquee/.test(q)) {
      const tent = sup.find((x) => x.role === "Tent & Weather");
      return { m: `Rain risk is ${WEATHER_RAIN}% for the 14th — that's the highest of the week. Shade & Shine hold a 160-pax marquee at ${tent ? fmtR(tent.price) : "quote on request"} and it's ${budget.kept.has("b12") ? "already inside your cap" : "currently deferred at this cap"}. I'd take it.`, act: { l: "Open Shade & Shine", go: () => tent && setSelSup(tent.id) } };
    }
    if (/rsvp|guest|invite|reply|replies/.test(q)) {
      return { m: `${rsvp.pend} households are still quiet — ${rsvp.pendSeats} seats. Confirmed seats sit at ${rsvp.headcount}; if everyone says yes you're at ${rsvp.maxcount} against ${guests} catered. ${RSVP_DAYS} days to the deadline.`, act: { l: `Queue ${profile.comm} round`, go: () => { setLens("rsvp"); chaseRsvp(); } } };
    }
    if (/budget|money|cost|afford|spend/.test(q)) {
      return { m: `You're at ${fmtR(budget.keptSum)} of ${fmtR(budgetCap)}, so ${fmtR(Math.max(0, budget.headroom))} spare. ${budget.dropped.length ? `${budget.dropped.length} items sit deferred: ${budget.dropped.slice(0, 3).map((d) => d.label.split("—")[0].trim()).join(", ")}.` : "Nothing is deferred right now."}${bundleApplied ? " The Oakfield package is already saving you R71k." : " Applying the Oakfield package would free another R71k."}`, act: bundleApplied ? { l: "Open budget", go: () => setLens("budget") } : { l: "Apply package · save R71k", go: () => applyBundle() } };
    }
    if (/palette|colour|color|theme|décor|decor|flower|floral/.test(q)) {
      const fl = sup.find((x) => x.role === "Flower Specialist");
      return { m: `You're on ${PALETTES[pal].name}. Bloom Room and Décor Elegance are both briefed to it — primary blooms in ${PALETTES[pal].cols[0]}, foliage ${PALETTES[pal].cols[2]}, linen ${PALETTES[pal].cols[3]}. Switch the palette and their brief moves with it.`, act: { l: "See Bloom Room's brief", go: () => fl && setSelSup(fl.id) } };
    }
    if (/issue|problem|risk|worry|wrong|clash/.test(q)) {
      return issues.length
        ? { m: `One thing is genuinely open: ${issues[0].name} — ${issues[0].issueNote}. That's costing you ${WEIGHTS.risk} points of readiness on its own. Everything else is noise by comparison.`, act: { l: `Open ${issues[0].name}`, go: () => setSelSup(issues[0].id) } }
        : { m: `Nothing red on the board right now. ${unconf.length ? `${unconf.length} core supplier${unconf.length > 1 ? "s" : ""} still unconfirmed, which is the next thing I'd close.` : "Core squad is fully confirmed."}`, act: { l: "Open readiness", go: () => setReadyOpen(true) } };
    }
    if (/ready|score|readiness|how are we|track/.test(q)) {
      const top = sug[0];
      return { m: `Readiness is ${R.total}. ${R.parts.filter((p) => p.pct < 70).map((p) => `${p.l.toLowerCase()} at ${p.pct}%`).join(", ") || "every component is above 70%"}. ${top ? `Biggest single move: ${top.t.toLowerCase()}.` : "Nothing material left."}`, act: { l: "Show the maths", go: () => setReadyOpen(true) } };
    }
    if (/supplier|squad|core|bench|who/.test(q)) {
      return { m: `Core is ${coreList.filter((s) => s.status === "confirmed").length}/${coreList.length} confirmed. ${pRoles.size ? `Your priorities push ${[...pRoles].join(", ")} to the front of the bench.` : ""}${unconf.length ? ` Outstanding: ${unconf.map((s) => s.name).join(", ")}.` : ""}`, act: { l: "Open squad", go: () => setLens("squad") } };
    }
    const top = sug[0];
    return { m: `Noted — I'll take it from here. While you're in: readiness ${R.total}, ${rsvp.pend} RSVPs open, ${fmtR(Math.max(0, budget.headroom))} budget spare.${top ? ` Best next move is ${top.t.toLowerCase()}.` : ""}`, act: top ? { l: "Do it", go: top.go } : null };
  }

  function sendMsg(preset?: string) {
    const mine = (preset ?? draft).trim();
    if (!mine) return;
    setMsgs((m) => [...m, { who: "You", t: now(), m: mine }]);
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const r = lungiReply(mine);
      setMsgs((m) => [...m, { who: "Lungi", t: now(), m: r.m, act: r.act ?? undefined }]);
    }, 900);
  }

  useEffect(() => { chatEnd.current?.scrollIntoView?.({ behavior: "smooth", block: "end" }); }, [msgs]);

  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  return (
    <div className="rise">
      <Card T={T} className="flex flex-col" style={{ height: "62vh", minHeight: 420 }}>
        <div className="mb-2 flex items-center gap-2 border-b pb-2" style={{ borderColor: T.border }}>
          <Face seed="coach" T={T} name="Lungi Dlodlo" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">Lungi Dlodlo · Wedding Coach</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: T.good }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: T.good, animation: "pulse 1.8s infinite" }} />Reads your board before she answers</div>
          </div>
          <Chip c={T.gold} T={T}>{profile.supp === "Full planning support" ? "acts first" : "flags first"}</Chip>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.who === "You" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-xs rounded-2xl px-3 py-2 text-sm sm:max-w-md" style={m.who === "You" ? { background: T.accent, color: T.onAccent, borderBottomRightRadius: 6 } : { background: T.panel2, color: T.ink, borderBottomLeftRadius: 6, border: `1px solid ${T.border}` }}>
                {m.who !== "You" && <div className="mb-0.5 text-xs font-bold" style={{ color: m.who === "Lungi" ? T.gold : T.accent }}>{m.who}</div>}
                <div style={{ lineHeight: 1.45 }}>{m.m}</div>
                {m.act && <button onClick={m.act.go} className="mt-2 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ background: T.gold, color: T.onGold }}>{m.act.l}<ArrowRight size={12} /></button>}
                <div className="mt-0.5 text-right text-xs" style={{ opacity: 0.6 }}>{m.t}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-3 py-2" style={{ background: T.panel2, border: `1px solid ${T.border}` }}>
                <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: T.faint, animation: `pulse 1.2s ${i * 0.2}s infinite` }} />)}</span>
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>
        <div className="mt-2 flex gap-2 border-t pt-2" style={{ borderColor: T.border }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()} placeholder="Ask about budget, RSVPs, palette, risk…" className="min-w-0 flex-1 rounded-xl px-3 py-2 text-sm outline-none" style={inputS} />
          <button onClick={() => sendMsg()} aria-label="Send" className="rounded-xl px-3 py-2" style={btnA}><Send size={15} /></button>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto">
          {["What's our rain plan?", "Where's the budget at?", "What's still at risk?", "Talk me through the palette", "How ready are we?"].map((x) => (
            <button key={x} onClick={() => sendMsg(x)} className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs" style={btnG}>{x}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}
