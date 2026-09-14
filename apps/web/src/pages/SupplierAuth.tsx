import { useEffect, useState } from "react";
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
  const [signupOpen, setSignupOpen] = useState<boolean | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const navigate = useNavigate();

  // Part C1: the launch gate applies to supplier signup too — reflect it
  // up front, not just via the server-side rejection.
  useEffect(() => {
    supabase.from("platform_settings").select("signup_open").eq("id", 1).single()
      .then(({ data }) => {
        setSignupOpen(data?.signup_open ?? false);
        if (data?.signup_open === false) setMode("signin");
      });
  }, []);

  const btnA = { background: T.accent, color: T.onAccent };
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
        // Same fix as ClientAuth.tsx: the hosted project requires email
        // confirmation (local dev doesn't, which is why this never showed
        // up testing locally) — signUp() succeeds but hands back no
        // session until the link is clicked. Navigating to /supplier
        // anyway put a signed-out visitor on a screen that immediately
        // discovers it has no user and bounces — the reported "black
        // page." Tell them to go confirm instead of pretending they're in.
        if (!data.session) {
          setPendingConfirmation(true);
          setBusy(false);
          return;
        }
        navigate("/supplier");
        return;
      }
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
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
          {pendingConfirmation ? (
            <>
              <div className="mb-1 text-lg font-extrabold" style={{ color: T.ink, fontFamily: "'Archivo Black',sans-serif" }}>
                Check your email
              </div>
              <div className="text-xs leading-relaxed" style={{ color: T.sub }}>
                We've sent a confirmation link to <b style={{ color: T.ink }}>{email}</b>. Click it, then come back and
                sign in below — the account isn't active until you do.
              </div>
              <button
                onClick={() => { setPendingConfirmation(false); setMode("signin"); }}
                className="mt-4 w-full text-center text-xs font-bold"
                style={{ color: T.accent }}
              >
                Back to sign in
              </button>
            </>
          ) : (
          <>
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

          {signupOpen === false ? (
            <div className="mt-4 text-center text-xs" style={{ color: T.faint }}>
              Pilot onboarding is not open yet — existing pilot accounts can sign in above.
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setPendingConfirmation(false); }}
              className="mt-4 w-full text-center text-xs font-bold"
              style={{ color: T.accent }}
            >
              {mode === "signup" ? "Already have an account? Sign in" : "New supplier? Create an account"}
            </button>
          )}
          </>
          )}
        </Card>
      </div>
    </div>
  );
}
