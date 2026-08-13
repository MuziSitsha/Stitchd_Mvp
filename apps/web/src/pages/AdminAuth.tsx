import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Header } from "../components/Header";

// Deliberately no self-signup here, unlike SupplierAuth: role_assignments has
// no client-facing insert policy (supabase/migrations/..._identity_and_ticket_spine.sql),
// so admin/ops accounts can only be provisioned directly (DB, or the sandbox
// auth-test-token helper) — never through this form.
export function AdminAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="auth-page portal-page">
        <h1>Ops / Admin Console</h1>
        <p>Sign in with an admin or ops account.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={busy}>
            {busy ? "Please wait..." : "Sign in"}
          </button>
        </form>
      </main>
    </>
  );
}
