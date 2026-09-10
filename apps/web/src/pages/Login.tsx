import { useState } from "react";
import { ClientAuth } from "./ClientAuth";

// Thin wrapper so ClientAuth (the front-door role-picker form) has a route
// of its own at /login, now that / renders the public Landing page instead.
// Owns the authError state for the same reason Entry used to — picking
// "Admin / Ops" with a non-staff account briefly mounts/unmounts the form
// while it checks role_assignments, which would wipe a component-local
// error before it was ever seen.
export function Login() {
  const [authError, setAuthError] = useState<string | null>(null);
  return <ClientAuth authError={authError} setAuthError={setAuthError} />;
}
