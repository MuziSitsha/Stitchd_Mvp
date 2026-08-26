import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Store, Users, ClipboardCheck, Gift } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { useProtoState } from "../../state/ProtoState";
import type { LensKey } from "./AppShell";

type Result = { kind: "supplier" | "guest" | "task" | "registry"; id: string; label: string; sub: string; go: () => void };

// Real client-side fuzzy search over what's already loaded in ProtoState —
// no backend needed, everything it searches (suppliers, guests, tasks,
// registry) is already in memory. Opened by the header's Search button or
// ⌘K/Ctrl+K from anywhere in the app.
export function SearchModal({
  open,
  onClose,
  setLens,
}: {
  open: boolean;
  onClose: () => void;
  setLens: (l: LensKey) => void;
}) {
  const { T } = useTheme();
  const { sup, gList, tasks, registry, setSelSup } = useProtoState();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const hits: Result[] = [];
    for (const s of sup) {
      if (s.name.toLowerCase().includes(needle) || s.role.toLowerCase().includes(needle)) {
        hits.push({ kind: "supplier", id: s.id, label: s.name, sub: s.role, go: () => { setLens("team"); setSelSup(s.id); } });
      }
    }
    for (const g of gList) {
      if (g.name.toLowerCase().includes(needle) || g.house.toLowerCase().includes(needle)) {
        hits.push({ kind: "guest", id: g.id, label: g.name, sub: g.house, go: () => setLens("guestlist") });
      }
    }
    for (const t of tasks) {
      if (t.title.toLowerCase().includes(needle)) {
        hits.push({ kind: "task", id: t.id, label: t.title, sub: t.st === "done" ? "Done" : `Due ${t.due}`, go: () => setLens("week") });
      }
    }
    for (const r of registry) {
      if (r.item.toLowerCase().includes(needle)) {
        hits.push({ kind: "registry", id: r.id, label: r.item, sub: "Registry", go: () => setLens("gifts") });
      }
    }
    return hits.slice(0, 20);
  }, [q, sup, gList, tasks, registry, setLens, setSelSup]);

  const ICON = { supplier: Store, guest: Users, task: ClipboardCheck, registry: Gift } as const;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-24">
      <div className="absolute inset-0" style={{ background: "rgba(5,5,10,0.6)" }} onClick={onClose} />
      <div className="rise relative w-full max-w-lg rounded-2xl border" style={{ background: T.panel, borderColor: T.border, maxHeight: "70vh" }}>
        <div className="flex items-center gap-2.5 border-b px-4 py-3" style={{ borderColor: T.border }}>
          <Search size={16} style={{ color: T.faint }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); if (e.key === "Enter" && results[0]) { results[0].go(); onClose(); } }}
            placeholder="Search suppliers, guests, tasks, registry…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            style={{ color: T.ink }}
          />
          <button aria-label="Close" onClick={onClose} className="shrink-0 rounded-lg p-1" style={{ color: T.faint }}><X size={16} /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 52px)" }}>
          {q.trim() && results.length === 0 && (
            <div className="px-4 py-8 text-center text-xs" style={{ color: T.faint }}>Nothing matches "{q}"</div>
          )}
          {!q.trim() && (
            <div className="px-4 py-8 text-center text-xs" style={{ color: T.faint }}>Start typing to search your suppliers, guests, tasks and registry.</div>
          )}
          {results.map((r) => {
            const I = ICON[r.kind];
            return (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => { r.go(); onClose(); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
                style={{ borderTop: `1px solid ${T.border}` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.panel2)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: rgba(T.accent, 0.12), color: T.accent }}><I size={13} /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold">{r.label}</div>
                  <div className="truncate text-[11px]" style={{ color: T.sub }}>{r.sub}</div>
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase" style={{ color: T.faint }}>{r.kind}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
