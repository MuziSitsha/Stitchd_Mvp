import { useMemo, useState } from "react";
import { Gift, PenLine, Plane, X } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Face } from "../../components/proto/Face";
import { randR } from "../../components/proto/data";
import { useProtoState, type RegistryItem } from "../../state/ProtoState";
import type { Theme } from "../../theme/theme";

const THANK_STATES = [
  { label: "Thanked", tone: "good" as const },
  { label: "Write a note", tone: "bad" as const },
  { label: "Draft ready", tone: "gold" as const },
];
const GIFT_LINES = ["Contributed to the honeymoon fund", "Kitchen essentials", "Contributed to the home deposit fund"];
const REG_COLORS = ["#6C4BE0", "#2E7D5B", "#2A7B8C", "#C2703D", "#B5478A"];

function AddRegistryItem({ onAdd }: { onAdd: (item: string, target: number) => void }) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState("");
  const [target, setTarget] = useState("");
  const inputS = { background: rgba("#fff", 0.1), color: "#fff", border: `1px solid ${rgba("#fff", 0.2)}` };

  if (!open) {
    return <button onClick={() => setOpen(true)} className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#F2C14E", color: "#3A2A05" }}>Add something</button>;
  }
  return (
    <div className="flex w-full flex-col gap-1.5 sm:w-72">
      <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="What are they giving towards?" className="rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
      <div className="flex gap-1.5">
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target (Rand)" inputMode="numeric" className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
        <button
          onClick={() => {
            const t = Number(target);
            if (!item.trim() || !t || t <= 0) return;
            onAdd(item.trim(), t);
            setItem(""); setTarget(""); setOpen(false);
          }}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold"
          style={{ background: "#F2C14E", color: "#3A2A05" }}
        >
          Add
        </button>
        <button onClick={() => setOpen(false)} aria-label="Cancel" className="shrink-0 rounded-lg px-2 py-1.5" style={{ color: rgba("#fff", 0.6) }}><X size={14} /></button>
      </div>
    </div>
  );
}

function ManageRegistryItem({ T, r, onSave, onRemove }: { T: Theme; r: RegistryItem; onSave: (patch: Partial<RegistryItem>) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(String(r.target));
  const [note, setNote] = useState(r.note);
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  if (!open) {
    return <button onClick={() => setOpen(true)} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ background: T.panel2, color: T.accent }}>Manage</button>;
  }
  return (
    <div className="flex w-full flex-col gap-1.5 rounded-xl border p-2.5" style={{ borderColor: T.border, background: T.panel2 }}>
      <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target (Rand)" inputMode="numeric" className="rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputS} />
      <div className="flex gap-1.5">
        <button
          onClick={() => {
            const t = Number(target);
            onSave({ target: t > 0 ? t : r.target, note });
            setOpen(false);
          }}
          className="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-bold"
          style={{ background: "#1A1726", color: "#fff" }}
        >
          Save
        </button>
        <button onClick={onRemove} className="rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ background: rgba(T.bad, 0.14), color: T.bad }}>Remove</button>
        <button onClick={() => setOpen(false)} aria-label="Cancel" className="rounded-lg px-2 py-1.5" style={{ color: T.faint }}><X size={14} /></button>
      </div>
    </div>
  );
}

// Us > Gifts — registry funds live in ProtoState's mutable `registry`
// (seeded from REGISTRY_SEED, same pattern as sup/gList/tasks) so "Add
// something" and "Manage" are real mutations, not placeholders. The
// thank-you tracker reuses real confirmed guests from gList rather than a
// second, disconnected name list.
export function Gifts() {
  const { T } = useTheme();
  const { gList, registry, setRegistry, toast } = useProtoState();

  const thanks = useMemo(
    () => gList.filter((g) => g.rsvp === "yes").slice(0, 5).map((g, i) => ({ g, state: THANK_STATES[i % 3], gift: GIFT_LINES[i % 3] })),
    [gList],
  );
  const raised = registry.reduce((a, r) => a + r.got, 0);
  const toThank = thanks.filter((t) => t.state.label !== "Thanked").length;
  const honeymoon = registry.find((r) => r.item.toLowerCase().includes("honeymoon"));

  function addRegistryItem(item: string, target: number) {
    setRegistry((rs) => [...rs, { id: `reg${Date.now()}`, item, target, got: 0, color: REG_COLORS[rs.length % REG_COLORS.length], note: "Just added." }]);
    toast(`"${item}" added to your registry`);
  }
  function saveRegistryItem(id: string, patch: Partial<RegistryItem>) {
    setRegistry((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    toast("Registry item updated");
  }
  function removeRegistryItem(id: string, item: string) {
    setRegistry((rs) => rs.filter((r) => r.id !== id));
    toast(`"${item}" removed from your registry`, "warn");
  }

  return (
    <div className="rise grid gap-3 lg:grid-cols-[1fr_290px] lg:items-start">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: T.border, background: "#1A1726" }}>
          <div>
            <div className="flex items-center gap-2" style={{ color: "#F2C14E" }}><Gift size={13} /><span className="text-xs font-bold" style={{ letterSpacing: 1 }}>REGISTRY</span></div>
            <div className="mt-1 text-2xl font-extrabold" style={{ color: "#fff" }}>{randR(raised)} <span className="text-sm font-semibold" style={{ color: rgba("#fff", 0.6) }}>given by {thanks.length} households so far</span></div>
            <div className="text-xs" style={{ color: rgba("#fff", 0.65) }}>Guests can give cash, contribute to a fund, or bring something on the day.</div>
          </div>
          <AddRegistryItem onAdd={addRegistryItem} />
        </div>

        <Card T={T}>
          <div className="mb-2 text-sm font-bold">What people are giving towards</div>
          <div className="space-y-3">
            {registry.map((r) => {
              const pct = Math.round((r.got / r.target) * 100);
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold">{r.item}</div>
                    <div className="truncate text-[11px]" style={{ color: T.faint }}>{r.note}</div>
                  </div>
                  <div className="w-full sm:w-40">
                    <div className="h-2 overflow-hidden rounded-full" style={{ background: T.panel2 }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: r.color }} />
                    </div>
                    <div className="tnum mt-0.5 text-[10px]" style={{ color: T.faint }}>{randR(r.got)} in of {randR(r.target)}</div>
                  </div>
                  <ManageRegistryItem T={T} r={r} onSave={(patch) => saveRegistryItem(r.id, patch)} onRemove={() => removeRegistryItem(r.id, r.item)} />
                </div>
              );
            })}
            {registry.length === 0 && <div className="py-6 text-center text-xs" style={{ color: T.faint }}>Nothing on the registry yet — add something above.</div>}
          </div>
        </Card>

        <Card T={T}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-bold">Thank-yous</div>
            <span className="text-xs" style={{ color: T.faint }}>{thanks.length - toThank} sent · {toThank} waiting</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {thanks.map(({ g, state, gift }) => (
              <div key={g.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: T.border }}>
                <Face seed={g.id} name={g.name} T={T} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold">{g.name}</div>
                  <div className="truncate text-[11px]" style={{ color: T.sub }}>{gift}</div>
                </div>
                {state.label === "Write a note" ? (
                  <button className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: rgba(T.bad, 0.14), color: T.bad }}><PenLine size={11} />{state.label}</button>
                ) : (
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: rgba(state.tone === "good" ? T.good : T.gold, 0.14), color: state.tone === "good" ? T.good : T.gold }}>{state.label}</span>
                )}
              </div>
            ))}
            {thanks.length === 0 && <div className="col-span-full py-6 text-center text-xs" style={{ color: T.faint }}>No confirmed guests to thank yet.</div>}
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {honeymoon && (
          <Card T={T} style={{ background: rgba(T.accent, 0.08), borderColor: rgba(T.accent, 0.35) }}>
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.accent, letterSpacing: 1 }}><Plane size={12} />HONEYMOON FUND</div>
            <div className="mt-1.5 text-xl font-extrabold">{randR(honeymoon.got)} <span className="text-sm font-semibold" style={{ color: T.faint }}>of {randR(honeymoon.target)}</span></div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: T.panel2 }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (honeymoon.got / honeymoon.target) * 100)}%`, background: T.accent }} />
            </div>
            <div className="mt-2 text-xs" style={{ color: T.sub }}>{honeymoon.note}</div>
          </Card>
        )}
        <Card T={T}>
          <div className="mb-1 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>ETIQUETTE, BRIEFLY</div>
          <div className="text-xs leading-relaxed" style={{ color: T.sub }}>In Gauteng most guests give cash. Listing a few things alongside the funds gives older family something to hold — and takes the guesswork out for them.</div>
        </Card>
      </div>
    </div>
  );
}
