import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CheckCircle2, AlertTriangle, Undo2 } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { rgba } from "../../theme/theme";

const THRESHOLD = 72;

// A toast that can carry a real undo action, discoverable via a genuine
// swipe gesture (pointer events, not a touch-only hack) rather than a
// second small "Undo" text button competing for space in an already-tight
// toast row. Swiping left far enough past THRESHOLD fires onUndo and
// dismisses; letting go short of it snaps back. Plain toasts (no onUndo)
// render as a static row, unchanged from before.
export function SwipeToast({
  m, tone, onUndo, onDismiss, T,
}: {
  m: string; tone: string; onUndo?: () => void; onDismiss: () => void; T: Theme;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  if (!onUndo) {
    return (
      <div className="rise flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold" style={{ background: T.panel, borderColor: rgba(tone === "good" ? T.good : T.warn, 0.5), color: T.ink, boxShadow: T.shadow }}>
        {tone === "good" ? <CheckCircle2 size={15} style={{ color: T.good }} /> : <AlertTriangle size={15} style={{ color: T.warn }} />}
        <span className="min-w-0 flex-1">{m}</span>
      </div>
    );
  }
  const undo = onUndo;

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragX(Math.min(0, e.clientX - startX.current));
  }
  function onPointerUp() {
    setDragging(false);
    if (dragX < -THRESHOLD) {
      undo();
      onDismiss();
    } else {
      setDragX(0);
    }
  }

  const revealPct = Math.min(1, Math.abs(dragX) / THRESHOLD);

  return (
    <div className="pointer-events-auto relative overflow-hidden rounded-xl" style={{ boxShadow: T.shadow }}>
      <div className="absolute inset-0 flex items-center justify-end gap-1.5 rounded-xl px-3" style={{ background: T.bad, color: "#fff", opacity: 0.35 + revealPct * 0.65 }}>
        <Undo2 size={14} />
        <span className="text-xs font-bold">Undo</span>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="rise relative flex touch-pan-y items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold"
        style={{
          background: T.panel, borderColor: rgba(tone === "good" ? T.good : T.warn, 0.5), color: T.ink,
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease",
          cursor: "grab",
        }}
      >
        {tone === "good" ? <CheckCircle2 size={15} style={{ color: T.good }} /> : <AlertTriangle size={15} style={{ color: T.warn }} />}
        <span className="min-w-0 flex-1">{m}</span>
        <span className="shrink-0 text-[10px] font-bold" style={{ color: T.faint }}>← slide to undo</span>
      </div>
    </div>
  );
}
