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
// stays completely untouched by this app; a client sees the wedding-
// planning onboarding wizard exactly once (a real `events` row is what
// "already onboarded" means from here on, not a resettable in-memory flag).
//
// Staff (ops/admin/super/coach) normally land straight on the Ops Console.
// The exception is a staff member who ALSO owns an event on the platform
// (the pilot's own team dogfooding a real wedding, and the single unified
// demo account): they land in that wedding, with an "Ops Console" link in
// the header and the Supplier Portal tab already granted by isStaff.
// AdminConsole.tsx's own role check stays the real gate on /admin either
// way.
export function Entry() {
  const { session, loading: authLoading } = useAuth();
  const { role, hasEvent, loading: roleLoading } = useResolvedRole(session);

  if (authLoading) return <Loading />;
  // "/" is the public Part C1 landing page for anyone not signed in; the
  // front-door auth form lives at /login now.
  if (!session) return <Landing />;
  if (roleLoading || !role) return <Loading />;

  if (role === "supplier") return <Navigate to="/supplier" replace />;
  if (role === "staff" && !hasEvent) return <Navigate to="/admin" replace />;
  return (
    <Prototype
      initialLens="today"
      skipOnboarding={hasEvent}
      isStaff={role === "staff"}
      ownerId={session.user.id}
    />
  );
}
