import { useState } from "react";
import { X, Star, BadgeCheck, AlertTriangle, Gift, Zap, CheckCircle2, Palette, Check, ArrowLeftRight, Phone, Sparkles, Ticket, Clock } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { PALETTES, PALETTE_ROLES } from "../../theme/palettes";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { Shot } from "./Shot";
import { MiniBar } from "./MiniBar";
import { STATUS_C, WA, perfScore, fmtR, type Supplier } from "./data";
import { useProtoState } from "../../state/ProtoState";
import { useLiveSupplierTickets } from "../../state/useLiveSupplierTickets";
import { createSupplierTicket } from "../../lib/functions";

const SWATCH_USE = ["Primary blooms", "Secondary blooms", "Foliage & depth", "Linen & stationery", "Metallics & candlelight"];

function catAvg(sup: Supplier[], role: string) {
  const p = sup.filter((x) => x.role === role);
  const n = p.length || 1;
  return {
    resp: p.reduce((s, x) => s + x.resp, 0) / n,
    onTime: p.reduce((s, x) => s + x.onTime, 0) / n,
    rebook: p.reduce((s, x) => s + x.rebook, 0) / n,
  };
}

// Ported exactly from stitchd-v9.jsx lines 2719-2768.
export function SupplierDrawer({ id, onClose, onOpenPalette }: { id: string; onClose: () => void; onOpenPalette: () => void }) {
  const { T, pal } = useTheme();
  const { sup, guests, bundleApplied, secure, moveZone, applyBundle, toast } = useProtoState();
  const tickets = useLiveSupplierTickets();
  const [requesting, setRequesting] = useState(false);
  const s = sup.find((x) => x.id === id);
  if (!s) return null;

  const perf = perfScore(s);
  const avg = catAvg(sup, s.role);
  const sc = STATUS_C(T)[s.status];
  const btnA = { background: T.accent, color: T.onAccent };
  const btnG = { background: "transparent", color: T.sub, border: `1px solid ${T.border}` };
  const ticket = tickets.get(s.name);
  const supplierName = s.name;

  async function requestConfirmation() {
    setRequesting(true);
    try {
      await createSupplierTicket(supplierName);
      toast("Confirmation requested");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't request confirmation", "warn");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(5,5,10,0.65)" }} onClick={onClose} />
      <div className="rise relative flex h-full w-full flex-col overflow-y-auto md:max-w-lg" style={{ background: T.bg, borderLeft: `3px solid ${sc}` }}>
        <div className="relative">
          <Shot role={s.role} seed={s.id} T={T} pal={pal} h={200}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(5,5,10,0.85) 100%)" }} />
          </Shot>
          <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 rounded-lg p-1.5" style={{ background: "rgba(5,5,10,0.6)", color: "#F2F0EC" }}><X size={15} /></button>
          <div className="absolute left-4 top-3" style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 34, color: "#F2F0EC", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{perf}</div>
          <div className="absolute bottom-3 left-4">
            <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 21, color: "#F2F0EC", letterSpacing: 0.5 }}>{s.name.toUpperCase()}</div>
            <div className="text-xs" style={{ color: "#CFCBDE" }}>{s.role} · {s.sub} · {s.viaBundle ? "in package" : fmtR(s.price)}</div>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip c={T.gold} T={T}><Star size={11} fill="currentColor" />{s.rating} · {s.reviews} reviews</Chip>
            <Chip c={sc} T={T}>{s.status === "confirmed" ? <><BadgeCheck size={11} />Confirmed</> : s.status === "issue" ? <><AlertTriangle size={11} />Issue</> : "Pending"}</Chip>
            {s.rec && s.status === "pending" && <Chip c={T.accent} T={T}><Sparkles size={11} />Recommended</Chip>}
          </div>

          {s.status === "issue" && (
            <Card T={T} style={{ borderColor: rgba(T.bad, 0.5) }}>
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" style={{ color: T.bad }} />
                <div><div className="font-bold" style={{ color: T.bad }}>Needs resolving</div><div style={{ color: T.sub }}>{s.issueNote}</div></div>
              </div>
            </Card>
          )}

          {s.bundle && (
            <Card T={T} style={{ borderColor: rgba(T.gold, 0.5) }}>
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: T.gold }}><Gift size={15} />Package includes</div>
              <div className="mt-1 text-xs" style={{ color: T.sub }}>{s.name} is a multi-service supplier — these run in-house under one contract:</div>
              <div className="mt-2 space-y-1">
                {s.bundle.map(([svc, cost]) => (
                  <div key={svc} className="flex items-center gap-2 text-xs">
                    <Check size={12} style={{ color: T.good }} />
                    <span className="min-w-0 flex-1 truncate">{svc}</span>
                    <span className="tnum" style={{ color: T.faint }}>{fmtR(cost)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs tnum" style={{ borderColor: T.border }}>
                <span style={{ color: T.sub }}>À la carte {fmtR(s.bundleList!)} → <b style={{ color: T.good }}>{fmtR(s.price)}</b></span>
                <b style={{ color: T.good }}>save {fmtR(s.bundleSaving!)}</b>
              </div>
              {!bundleApplied && (
                <button onClick={() => applyBundle()} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold press" style={btnA}>
                  <Zap size={12} />Apply package · save {fmtR(s.bundleSaving!)}
                </button>
              )}
              {bundleApplied && <div className="mt-2 flex items-center gap-1 text-xs font-bold" style={{ color: T.good }}><CheckCircle2 size={12} />Package active</div>}
            </Card>
          )}

          {PALETTE_ROLES[s.role] && (
            <Card T={T} style={{ borderColor: rgba(T.gold, 0.5) }}>
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: T.gold }}><Palette size={15} />Your palette, their brief</div>
              <div className="mt-1 text-xs" style={{ color: T.sub }}>{s.name} builds the <b style={{ color: T.ink }}>{PALETTE_ROLES[s.role]}</b> to <b style={{ color: T.ink }}>{PALETTES[pal].name}</b>. Change the palette and this brief changes with it.</div>
              <div className="mt-2 space-y-1">
                {PALETTES[pal].cols.map((c, i) => (
                  <div key={c} className="flex items-center gap-2">
                    <span className="h-6 w-10 shrink-0 rounded" style={{ background: c, border: `1px solid ${T.border}` }} />
                    <span className="min-w-0 flex-1 truncate text-xs" style={{ color: T.sub }}>{SWATCH_USE[i]}</span>
                    <span className="shrink-0 text-xs" style={{ color: T.faint, fontFamily: "ui-monospace,monospace" }}>{c}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { onOpenPalette(); toast("Palette picker open — the brief updates as you choose"); }} className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={btnG}>
                <Palette size={12} />Change the palette
              </button>
            </Card>
          )}

          <Card T={T}>
            <div className="mb-2 text-sm font-bold">Performance vs category</div>
            <div className="space-y-2.5">
              <MiniBar label={`Responds in ${s.resp}h (avg ${avg.resp.toFixed(0)}h)`} pct={Math.round((1 - s.resp / 24) * 100)} c={s.resp <= avg.resp ? T.good : T.warn} T={T} right={s.resp <= avg.resp ? "Faster than avg" : "Slower than avg"} />
              <MiniBar label={`On-time delivery (avg ${avg.onTime.toFixed(0)}%)`} pct={s.onTime} c={s.onTime >= avg.onTime ? T.good : T.warn} T={T} />
              <MiniBar label={`Couples who'd rebook (avg ${avg.rebook.toFixed(0)}%)`} pct={s.rebook} c={s.rebook >= avg.rebook ? T.good : T.warn} T={T} />
            </div>
          </Card>

          <Card T={T}>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Ticket size={15} style={{ color: T.gold }} />Confirmation ticket</div>
            {(!ticket || ticket.status === "declined") && (
              <>
                {ticket?.status === "declined" && (
                  <div className="mb-2 flex items-start gap-2 rounded-lg p-2" style={{ background: rgba(T.bad, 0.1) }}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: rgba(T.bad, 0.18), color: T.bad }}><X size={11} /></span>
                    <div className="text-xs">
                      <div className="font-semibold" style={{ color: T.bad }}>They said no</div>
                      <div style={{ color: T.faint }}>by {ticket.confirmedRole === "admin" ? "an admin" : s.name} · {ticket.confirmedAt ? new Date(ticket.confirmedAt).toLocaleString() : ""}</div>
                    </div>
                  </div>
                )}
                <div className="mb-2 text-xs" style={{ color: T.sub }}>Request confirmation from {s.name} or an admin — you'll see it turn orange, then green once confirmed.</div>
                <button onClick={requestConfirmation} disabled={requesting} className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold press disabled:opacity-60" style={btnA}>
                  <Ticket size={12} />{requesting ? "Requesting…" : ticket?.status === "declined" ? "Request again" : "Request confirmation"}
                </button>
              </>
            )}
            {ticket && ticket.status !== "declined" && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: rgba(T.good, 0.15), color: T.good }}><Check size={11} /></span>
                  <div className="text-xs"><div className="font-semibold">Ticket created</div><div style={{ color: T.faint }}>{new Date(ticket.createdAt).toLocaleString()}</div></div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: rgba(ticket.status === "pending" ? T.warn : T.good, 0.15), color: ticket.status === "pending" ? T.warn : T.good }}>
                    <Clock size={11} />
                  </span>
                  <div className="text-xs"><div className="font-semibold">{ticket.status === "pending" ? "Awaiting confirmation" : "Confirmation received"}</div>
                    {ticket.status === "pending" && <div style={{ color: T.warn }}>Waiting on {s.name} or an admin</div>}
                  </div>
                </div>
                <div className="flex items-start gap-2" style={{ opacity: ticket.status === "confirmed" ? 1 : 0.4 }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: rgba(T.good, 0.15), color: T.good }}><CheckCircle2 size={11} /></span>
                  <div className="text-xs">
                    <div className="font-semibold">Confirmed</div>
                    {ticket.status === "confirmed" ? (
                      <div style={{ color: T.faint }}>by {ticket.confirmedRole === "admin" ? "an admin" : s.name} · {ticket.confirmedAt ? new Date(ticket.confirmedAt).toLocaleString() : ""}</div>
                    ) : (
                      <div style={{ color: T.faint }}>Not yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Shot seed={s.id + "a"} T={T} pal={pal} h={92} radius={10}><span className="absolute bottom-1 left-1.5 rounded px-1 text-xs" style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>Portfolio</span></Shot>
            <Shot seed={s.id + "b"} T={T} pal={pal} h={92} radius={10}><span className="absolute bottom-1 left-1.5 rounded px-1 text-xs" style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>Recent event</span></Shot>
          </div>

          <Card T={T}>
            <div className="mb-1 text-sm font-bold">What couples say</div>
            <div className="text-sm" style={{ color: T.sub }}>"Effortless communication and everything landed exactly on time — worth every rand." · <span style={{ color: T.faint }}>Boitumelo &amp; Andile, June 2026</span></div>
          </Card>

          <div className="flex gap-2">
            <button
              onClick={() => secure(s.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold"
              style={s.status === "confirmed" ? { background: rgba(T.bad, 0.12), color: T.bad, border: `1px solid ${rgba(T.bad, 0.4)}` } : s.status === "issue" ? { background: T.bad, color: "#fff" } : btnA}
            >
              {s.status === "confirmed" ? "Un-confirm" : s.status === "issue" ? "Resolve & confirm" : <><BadgeCheck size={15} />Confirm for 14 Nov</>}
            </button>
            <button onClick={() => moveZone(s.id)} className="flex items-center gap-1.5 rounded-xl px-3 py-3 text-sm font-semibold" style={btnG}>
              <ArrowLeftRight size={14} />{s.zone === "core" ? "Bench" : "Core"}
            </button>
            <a
              href={`https://wa.me/${WA[s.id] || "27820000000"}?text=${encodeURIComponent(`Hi ${s.name}, it's Junior & Nadine — our wedding is Saturday 14 November 2026 at Oakfield Farm, ${guests} guests. ${PALETTE_ROLES[s.role] ? `We've settled on a ${PALETTES[pal].name} palette. ` : ""}Could you confirm availability and send a quote?`)}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp ${s.name}`}
              className="flex items-center rounded-xl px-3 py-3"
              style={btnG}
            >
              <Phone size={15} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
