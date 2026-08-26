import type { LucideIcon } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";

// Interim placeholder for new-IA screens not yet built out (see the
// phased redesign plan) — every nav destination stays reachable and
// honest about its state instead of a dead/broken tab.
export function ComingSoon({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  const { T } = useTheme();
  return (
    <div className="rise">
      <Card T={T} className="flex flex-col items-center gap-2 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: rgba(T.accent, 0.14), color: T.accent }}>
          <Icon size={22} />
        </span>
        <div className="text-sm font-bold">{label}</div>
        <div className="max-w-xs text-xs" style={{ color: T.sub }}>This part of the redesign is being built next — check back soon.</div>
      </Card>
    </div>
  );
}
