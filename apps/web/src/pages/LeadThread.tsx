import { useParams, useSearchParams } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { Card } from "../components/proto/Card";
import { Logo } from "../components/Logo";
import { LeadThreadPanel } from "../components/proto/LeadThreadPanel";

// The customer side of Phase 2 messaging — reached only via the magic link
// texted to them when a supplier first replies to their Stitch It request
// (see supabase/functions/lead-messages). No login: the ref in the path plus
// the token in the query string are the only credential a Stitch It customer
// ever has, since most of these are anonymous checkouts with no account.
export function LeadThread() {
  const { T } = useTheme();
  const { ref } = useParams<{ ref: string }>();
  const [params] = useSearchParams();
  const token = params.get("token") ?? undefined;

  if (!ref || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: T.bg }}>
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-center"><Logo size={22} T={T} dashColor={T.accent} /></div>
          <Card T={T} className="!p-6" style={{ borderRadius: 24 }}>
            <div className="text-sm" style={{ color: T.sub }}>This link is missing its access code — ask the supplier to resend it.</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: T.bg }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo size={22} T={T} dashColor={T.accent} /></div>
        <Card T={T} className="!p-6" style={{ borderRadius: 24 }}>
          <div className="mb-1 text-lg font-extrabold" style={{ color: T.ink, fontFamily: "'Archivo Black',sans-serif" }}>
            Your request
          </div>
          <div className="mb-4 text-xs" style={{ color: T.sub }}>
            Message the supplier about {ref} — no account needed.
          </div>
          <LeadThreadPanel T={T} leadRef={ref} token={token} />
        </Card>
      </div>
    </div>
  );
}
