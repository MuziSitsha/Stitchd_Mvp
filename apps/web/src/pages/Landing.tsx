import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, ClipboardCheck, LifeBuoy, ChevronDown } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/theme";
import { Logo } from "../components/Logo";
import { supabase } from "../lib/supabase";

// Part C1: the public, supplier-first landing page. Deliberately
// informational only — "No invented counts, testimonials, earnings or
// availability may appear on any public surface." Every CTA reads the
// server-enforced launch flag (platform_settings.signup_open); while it's
// closed, account CTAs render the spec's exact "Pilot onboarding is not
// open yet" state instead of a path that a direct API call could get past
// anyway (the before_user_created hook rejects it server-side).
const PRINCIPLES = [
  { I: ClipboardCheck, title: "Clarity", body: "One shared source of truth for the decisions, people, money and timing behind a wedding — not a dozen WhatsApp threads nobody can search." },
  { I: ShieldCheck, title: "Readiness", body: "Suppliers confirm what they've agreed to deliver, and that they're ready, before the day — not after something has already broken." },
  { I: LifeBuoy, title: "Recovery", body: "When reality changes — and it does — there's already a named owner, a next action, and a person who picks up the phone." },
];

const HOW_IT_WORKS = [
  { n: "01", t: "Apply and get verified", d: "Tell us your categories, service area and how you price. We check your contact details, trading identity, and the evidence that's actually material to your category." },
  { n: "02", t: "Receive qualified requests", d: "Couples send a structured request — function, date, area, headcount, budget hint. One request per supplier, never a blast, never competitor pricing or a guest list." },
  { n: "03", t: "Quote, confirm, deliver", d: "Send a quote the couple can compare like-for-like. Once it's accepted, you see exactly what you've agreed to, and reconfirm readiness at set checkpoints." },
];

const VERIFICATION_POINTS = [
  "Contact email and phone confirmed.",
  "Authorised representative and trading identity checked. Company registration stays optional for sole traders — we look at the evidence that's actually there.",
  "Portfolio and source rights checked.",
  "Category-specific evidence reviewed where it's material.",
];

const COHORT_TERMS = [
  "First release is weddings only, in Gauteng, with a small controlled group of couples and suppliers.",
  "Pricing, cancellation and refund terms are set per pilot package — no historical draft price becomes a fixed tariff.",
  "Growth uses approved proof and consented testimonials only, and only after the service is staffed and tested.",
];

const FAQS = [
  { q: "What does “verified” actually mean?", a: "Approval, evidence checks, availability and performance are reported as four separate facts. “Approved” is not a blanket quality or safety guarantee, and we never fuse those into a single trust score or invent star ratings." },
  { q: "Do you take a cut of what the couple pays me?", a: "Supplier contract value is event spend, not STITCHD revenue. STITCHD charges a separate service fee, invoiced and reconciled on its own." },
  { q: "Is this live yet?", a: "We're running a small, controlled pilot. Public onboarding opens once the service is staffed and the release gates are met — interviews and non-binding expressions of interest continue in the meantime." },
  { q: "Who owns STITCHD?", a: "STITCHD is the product and trading brand of Gubudo Consulting (Pty) Ltd." },
];

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <section className="mx-auto w-full max-w-3xl px-5 py-10" style={style}>{children}</section>;
}

export function Landing() {
  const { T } = useTheme();
  const navigate = useNavigate();
  const [signupOpen, setSignupOpen] = useState<boolean | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    supabase.from("platform_settings").select("signup_open").eq("id", 1).single()
      .then(({ data }) => setSignupOpen(data?.signup_open ?? false));
  }, []);

  const gated = signupOpen === false;

  function supplierCta() {
    if (gated) return;
    navigate("/supplier/login");
  }
  function coupleCta() {
    if (gated) return;
    navigate("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.ink, fontFamily: "'Manrope',system-ui,sans-serif" }}>
      {/* Header */}
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <Logo size={20} T={T} dashColor={T.accent} />
        <button onClick={() => navigate("/login")} className="text-xs font-bold" style={{ color: T.sub }}>Sign in</button>
      </header>

      {/* Hero */}
      <Section>
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.accent }}>Weddings first · Gauteng first</div>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ fontFamily: "'Archivo Black',sans-serif" }}>
          The wedding operating system for beautiful plans and real-world readiness.
        </h1>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: T.sub }}>
          A wedding runs on about a dozen suppliers and a guest list nobody can pin down. STITCHD is the shared place
          where that plan lives — so the couple sees what's next and what's late, suppliers confirm they're ready before
          the day, and guests reply to an invitation in under two minutes without downloading anything.
        </p>

        {gated && (
          <div className="mt-6 rounded-xl border p-3 text-xs" style={{ borderColor: rgba(T.warn, 0.5), background: rgba(T.warn, 0.08), color: T.ink }}>
            <b style={{ color: T.warn }}>Pilot onboarding is not open yet.</b> We're running a small, controlled group in
            Gauteng first. Existing pilot accounts can sign in above.
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={supplierCta}
            disabled={gated}
            className="flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50"
            style={{ background: T.accent, color: T.onAccent }}
          >
            Join the supplier network {!gated && <ArrowRight size={15} />}
          </button>
          <button
            onClick={coupleCta}
            disabled={gated}
            className="flex items-center justify-center gap-1.5 rounded-xl border px-5 py-3 text-sm font-bold disabled:opacity-50"
            style={{ borderColor: T.border, color: T.ink }}
          >
            Plan your wedding
          </button>
        </div>
      </Section>

      {/* Principles */}
      <Section style={{ background: T.panel2 }}>
        <div className="grid gap-4 sm:grid-cols-3">
          {PRINCIPLES.map(({ I, title, body }) => (
            <div key={title}>
              <I size={20} style={{ color: T.accent }} />
              <div className="mt-2 text-sm font-bold">{title}</div>
              <div className="mt-1 text-xs leading-relaxed" style={{ color: T.sub }}>{body}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works — supplier */}
      <Section>
        <h2 className="text-lg font-black" style={{ fontFamily: "'Archivo Black',sans-serif" }}>How it works for suppliers</h2>
        <div className="mt-4 space-y-4">
          {HOW_IT_WORKS.map(({ n, t, d }) => (
            <div key={n} className="flex gap-3">
              <div className="shrink-0 text-sm font-black" style={{ color: rgba(T.accent, 0.6) }}>{n}</div>
              <div>
                <div className="text-sm font-bold">{t}</div>
                <div className="mt-0.5 text-xs leading-relaxed" style={{ color: T.sub }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Verification */}
      <Section style={{ background: T.panel2 }}>
        <h2 className="text-lg font-black" style={{ fontFamily: "'Archivo Black',sans-serif" }}>What verification actually means</h2>
        <ul className="mt-4 space-y-2">
          {VERIFICATION_POINTS.map((p) => (
            <li key={p} className="flex gap-2 text-xs leading-relaxed" style={{ color: T.sub }}>
              <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: T.accent }} />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs" style={{ color: T.faint }}>
          Each check records the reviewer, source, date, expiry and outcome. Approval, evidence, availability and
          performance stay four separate facts — never one score.
        </p>
      </Section>

      {/* Founding cohort */}
      <Section>
        <h2 className="text-lg font-black" style={{ fontFamily: "'Archivo Black',sans-serif" }}>Founding-cohort conditions</h2>
        <ul className="mt-4 space-y-2">
          {COHORT_TERMS.map((t) => (
            <li key={t} className="text-xs leading-relaxed" style={{ color: T.sub }}>— {t}</li>
          ))}
        </ul>
      </Section>

      {/* For couples */}
      <Section style={{ background: T.panel2 }}>
        <h2 className="text-lg font-black" style={{ fontFamily: "'Archivo Black',sans-serif" }}>For couples</h2>
        <p className="mt-3 text-xs leading-relaxed" style={{ color: T.sub }}>
          Create your wedding, and get one useful thing done in five minutes — invite guests, find a supplier, or organise
          the plan. Everything else fills in as you go. Guests reply to a personal invitation link with no login and no app.
        </p>
        <button onClick={coupleCta} disabled={gated} className="mt-4 flex items-center gap-1.5 text-xs font-bold disabled:opacity-50" style={{ color: T.accent }}>
          Plan your wedding <ArrowRight size={13} />
        </button>
      </Section>

      {/* FAQ */}
      <Section>
        <h2 className="text-lg font-black" style={{ fontFamily: "'Archivo Black',sans-serif" }}>Questions</h2>
        <div className="mt-4 divide-y" style={{ borderColor: T.border }}>
          {FAQS.map(({ q, a }, i) => (
            <div key={q} className="py-3" style={{ borderColor: T.border }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between text-left text-sm font-semibold">
                {q}
                <ChevronDown size={15} className="shrink-0 transition-transform" style={{ color: T.faint, transform: openFaq === i ? "rotate(180deg)" : "none" }} />
              </button>
              {openFaq === i && <p className="mt-2 text-xs leading-relaxed" style={{ color: T.sub }}>{a}</p>}
            </div>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-3xl px-5 py-8 text-center text-[11px]" style={{ color: T.faint, borderTop: `1px solid ${T.border}` }}>
        <div className="mb-1"><Logo size={14} T={T} dashColor={T.faint} /></div>
        STITCHD is the product and trading brand of Gubudo Consulting (Pty) Ltd. Beautifully planned. Ready for reality.
      </footer>
    </div>
  );
}
