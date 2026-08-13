import { useTheme } from "../theme/ThemeContext";
import { Card } from "../components/proto/Card";

export function ComingSoon({ label }: { label: string }) {
  const { T } = useTheme();
  return (
    <Card T={T} className="rise flex flex-col items-center gap-2 py-16 text-center">
      <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 600, color: T.ink }}>{label}</div>
      <p style={{ color: T.sub, fontSize: 13, maxWidth: 360 }}>
        This lens is being ported from the prototype next — same design system, same data model, real content to follow.
      </p>
    </Card>
  );
}
