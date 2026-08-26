import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../lib/useAuth";
import { useResolvedRole } from "../lib/useResolvedRole";
import { ClientAuth } from "./ClientAuth";
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
  // Lifted up here rather than left local to ClientAuth: picking "Admin/Ops"
  // with a non-staff account briefly creates a real session (to check
  // role_assignments) before signing back out — that transition unmounts
  // and later remounts ClientAuth, which would silently wipe a
  // component-local error state before the person ever saw it.
  const [authError, setAuthError] = useState<string | null>(null);

  if (authLoading) return <Loading />;
  if (!session) return <ClientAuth authError={authError} setAuthError={setAuthError} />;
  if (roleLoading || !role) return <Loading />;

  if (role === "supplier") return <Navigate to="/supplier" replace />;
  if (role === "staff") return <Prototype initialLens="today" skipOnboarding isStaff ownerId={session.user.id} />;
  return <Prototype initialLens="today" skipOnboarding={hasEvent} ownerId={session.user.id} />;
}
