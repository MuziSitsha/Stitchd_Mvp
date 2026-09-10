import { Navigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../lib/useAuth";
import { useResolvedRole } from "../lib/useResolvedRole";
import { Landing } from "./Landing";
import { Prototype } from "./Prototype";

function Loading() {
  const { T } = useTheme();
  return (
    <div className="flex min-h-screen items-center justify-center text-sm" style={{ background: T.bg, color: T.sub }}>
      Loading…
    </div>
  );
}

// The one real gate at "/" — replaces what used to be unconditional,
// no-auth access straight into the prototype. Routes a signed-in person by
// who they actually are: a supplier's own dashboard lives at /supplier and
// stays completely untouched by this app; internal staff (ops/admin/super/
// coach) skip onboarding but land on Squad the same as everyone else — the
// Supplier Portal tab is still right there in their nav (isStaff grants it
// visibility, see AppShell.tsx), just not auto-selected on arrival; a
// client sees the wedding-planning onboarding wizard exactly once (a real
// `events` row is what "already onboarded" means from here on, not a
// resettable in-memory flag).
export function Entry() {
  const { session, loading: authLoading } = useAuth();
  const { role, hasEvent, loading: roleLoading } = useResolvedRole(session);

  if (authLoading) return <Loading />;
  // "/" is the public Part C1 landing page for anyone not signed in; the
  // front-door auth form lives at /login now.
  if (!session) return <Landing />;
  if (roleLoading || !role) return <Loading />;

  if (role === "supplier") return <Navigate to="/supplier" replace />;
  // Staff (ops/admin/super/coach) means the real ops console, not a client
  // dashboard wearing a staff badge — admin is a moderation/oversight seat
  // over both the client and supplier apps, not a third "which app am I"
  // choice. AdminConsole.tsx's own access check is the real gate (a coach-
  // only account lands there and sees "not authorised", same as visiting
  // /admin/login directly with the wrong role).
  if (role === "staff") return <Navigate to="/admin" replace />;
  return <Prototype initialLens="today" skipOnboarding={hasEvent} ownerId={session.user.id} />;
}
