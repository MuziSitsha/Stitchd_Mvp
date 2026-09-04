import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { Card } from "../components/proto/Card";
import { Logo } from "../components/Logo";
import { supabase } from "../lib/supabase";

export function SupplierAuth() {
  const { T } = useTheme();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const btnA = { background: T.accent, color: T.onAccent };
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: authError } =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;
      navigate("/supplier");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: T.bg }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={22} T={T} dashColor={T.accent} />
        </div>
        <Card T={T} className="!p-6" style={{ borderRadius: 24 }}>
          <div className="mb-1 text-lg font-extrabold" style={{ color: T.ink, fontFamily: "'Archivo Black',sans-serif" }}>
            Supplier Portal
          </div>
          <div className="mb-4 text-xs" style={{ color: T.sub }}>
            {mode === "signup" ? "Create your supplier account" : "Sign in to your supplier account"}
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={inputS}
            />
            <input
              type="password"
              placeholder="Password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={inputS}
            />
            {error && <div className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>{error}</div>}
            <button type="submit" disabled={busy} className="press flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold" style={btnA}>
              {busy ? "Please wait…" : (
                <>
                  {mode === "signup" ? "Create account" : "Sign in"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-4 w-full text-center text-xs font-bold"
            style={{ color: T.accent }}
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New supplier? Create an account"}
          </button>
        </Card>
      </div>
    </div>
  );
}
