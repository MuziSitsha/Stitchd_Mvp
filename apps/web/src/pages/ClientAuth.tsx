import { useEffect, useState, type FormEvent } from "react";
import { Heart, Store, ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { Card } from "../components/proto/Card";
import { Logo } from "../components/Logo";
import { supabase } from "../lib/supabase";

type Mode = "signin" | "signup";
type Role = "client" | "supplier" | "admin";

const ROLE_OPTS: { key: Role; label: string; I: typeof Heart }[] = [
  { key: "client", label: "Customer", I: Heart },
  { key: "supplier", label: "Supplier", I: Store },
  { key: "admin", label: "Admin / Ops", I: ShieldCheck },
];

// The one real front door at "/" — replaces what used to be anonymous,
// no-auth access straight into the prototype. Both sign-in and sign-up ask
// which of the three you are — sign-up excludes Admin/Ops (matches
// AdminAuth.tsx's "no self-signup" policy, those accounts are only ever
// provisioned directly). The choice is re-declared every sign-in rather
// than remembered anywhere, which is deliberate: it means a supplier
// account with nothing claimed yet always lands back on the existing
// /supplier/claim flow instead of needing its intent persisted in a new
// column — same reasoning STITCHD-SRS-SDS.md's own actor table implies
// (Client/Supplier/Ops are separate entry points, not one auto-detected
// blob). Admin is the one choice that's actually verified against
// role_assignments before anything is granted, since it's the only
// destination with access to other people's data.
export function ClientAuth({
  authError: error,
  setAuthError: setError,
}: {
  authError: string | null;
  setAuthError: (e: string | null) => void;
}) {
  const { T } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<Role>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // Part C1: while the launch flag is closed, sign-up isn't just server-
  // rejected — the form says so up front rather than after the user's
  // filled it in.
  const [signupOpen, setSignupOpen] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.from("platform_settings").select("signup_open").eq("id", 1).single()
      .then(({ data }) => {
        setSignupOpen(data?.signup_open ?? false);
        if (data?.signup_open === false) setMode("signin");
      });
  }, []);

  const btnA = { background: T.accent, color: T.onAccent };
  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const visibleRoles = mode === "signup" ? ROLE_OPTS.filter((r) => r.key !== "admin") : ROLE_OPTS;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (role === "supplier") {
          navigate("/supplier");
          return;
        }
        // Client: no manual redirect needed — Entry.tsx watches the session
        // reactively and moves on once useAuth() picks up the new session.
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        if (role === "supplier") {
          navigate("/supplier");
          return;
        }
        if (role === "admin") {
          const userId = data.session?.user.id;
          const { data: staffRows } = await supabase
            .from("role_assignments")
            .select("role")
            .eq("user_id", userId)
            .eq("status", "active")
            .in("role", ["ops", "admin", "super", "coach"]);
          if (!staffRows || staffRows.length === 0) {
            await supabase.auth.signOut();
            setError("This account isn't set up as an admin/ops account.");
            setBusy(false);
            return;
          }
          // Staff confirmed — Entry.tsx resolves the same session the same
          // way and lands on the Supplier Portal tab; nothing more to do.
        }
        // Customer (or a just-confirmed admin): no manual redirect — Entry.tsx takes over.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    const next = mode === "signup" ? "signin" : "signup";
    setMode(next);
    setError(null);
    if (next === "signup" && role === "admin") setRole("client");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: T.bg }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={22} T={T} dashColor={T.accent} />
        </div>
        <Card T={T} className="!p-6" style={{ borderRadius: 24 }}>
            <div className="mb-1 text-lg font-extrabold" style={{ color: T.ink, fontFamily: "'Archivo Black',sans-serif" }}>
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </div>
            <div className="mb-4 text-xs" style={{ color: T.sub }}>
              {mode === "signup" ? "Plan a wedding, or list your business — pick below." : "Who's signing in?"}
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleRoles.length}, minmax(0, 1fr))` }}>
                {visibleRoles.map(({ key, label, I }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRole(key)}
                    className="press flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold"
                    style={
                      role === key
                        ? { borderColor: T.accent, borderWidth: 2, background: rgba(T.accent, 0.1), color: T.ink }
                        : { borderColor: T.border, color: T.sub, background: T.panel2 }
                    }
                  >
                    <I size={16} style={{ color: role === key ? T.accent : T.faint }} />
                    <span className="text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
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
              <button onClick={toggleMode} className="mt-4 w-full text-center text-xs font-bold" style={{ color: T.accent }}>
                {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            )}
        </Card>
      </div>
    </div>
  );
}
