import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle2, Zap, Camera } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { rgba, type Theme } from "../theme/theme";
import { supabase } from "../lib/supabase";
import { PortalShell, PortalCard } from "../components/PortalShell";
import { ImageUpload } from "../components/proto/ImageUpload";
import { CATEGORIES } from "./SupplierClaim";
import { PRICING_UNITS, pricePreview, type PricingUnit } from "../lib/pricing";

export { PRICING_UNITS, pricePreview, type PricingUnit };

const TITLES = ["Your business", "Tell clients what you do", "Your pricing", "How clients reach you", "Add a cover photo", "Review & submit"];
const SUBS = [
  "Your name and trade — this is how clients will find you.",
  "A quick line and a longer description clients see on your listing.",
  "How you charge shapes what clients see next to your name.",
  "Real contact details — this is how you'll actually hear about a new lead.",
  "Optional, but a listing with a real photo stands out.",
  "One more look before this goes to admin for review.",
];

function Effect({ T, children }: { T: Theme; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl p-2.5 text-xs" style={{ background: rgba(T.gold, 0.1), color: T.gold }}>
      <Zap size={13} className="mt-0.5 shrink-0" /><span style={{ lineHeight: 1.45 }}>{children}</span>
    </div>
  );
}

// The real supplier equivalent of components/proto/Onboarding.tsx — same
// step/progress/effect-callout language, but a dedicated page rather than a
// modal overlay: a brand-new supplier has no dashboard rendered underneath
// to gate, so there's nothing for a modal to sit on top of. One real write
// at the end (suppliers + supplier_categories), same as the client wizard's
// single `events` insert — everything else is just wizard state until then.
export function SupplierOnboarding() {
  const { T } = useTheme();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [extraCategories, setExtraCategories] = useState<Set<string>>(new Set());
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [pricingUnit, setPricingUnit] = useState<PricingUnit>("total");
  const [priceRand, setPriceRand] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not signed in, or already has a claimed listing — this page isn't for
  // them (mirrors the same guard added to SupplierClaim.tsx).
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate("/supplier/login", { replace: true }); return; }
      supabase
        .from("suppliers")
        .select("id")
        .eq("profile_id", data.user.id)
        .maybeSingle()
        .then(({ data: existing }) => {
          if (existing) { navigate("/supplier", { replace: true }); return; }
          setChecking(false);
        });
    });
  }, [navigate]);

  async function handlePhotoFiles(files: FileList) {
    const file = files[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) { setUploadingPhoto(false); return; }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${userRes.user.id}/cover.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("supplier-photos").upload(path, file, { upsert: true });
    if (uploadErr) {
      setError(uploadErr.message);
      setUploadingPhoto(false);
      return;
    }
    const { data } = supabase.storage.from("supplier-photos").getPublicUrl(path);
    setPhotoUrl(`${data.publicUrl}?t=${Date.now()}`); // cache-bust — upsert reuses the same path
    setUploadingPhoto(false);
  }

  const categories = [...new Set([primaryCategory, ...extraCategories].filter(Boolean))];
  const priceCents = pricingUnit === "quote_only" ? null : Math.round((parseFloat(priceRand) || 0) * 100);
  const preview = pricePreview(pricingUnit, priceRand);

  const stepValid = [
    !!name.trim() && !!primaryCategory,
    true,
    pricingUnit === "quote_only" || (priceCents !== null && priceCents > 0),
    !!phone.trim(),
    true,
    true,
  ][step];

  async function submit() {
    setSubmitting(true);
    setError(null);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      setError("You're signed out — sign in again.");
      setSubmitting(false);
      return;
    }

    // Belt and suspenders — the DB's own unique index is the real guard now,
    // this just gives a friendlier landing than a raw 409 if two tabs race.
    const { data: existing } = await supabase.from("suppliers").select("id").eq("profile_id", userRes.user.id).maybeSingle();
    if (existing) { navigate("/supplier", { replace: true }); return; }

    const { data: created, error: createErr } = await supabase
      .from("suppliers")
      .insert({
        profile_id: userRes.user.id,
        name: name.trim(),
        category: primaryCategory,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        pricing_unit: pricingUnit,
        price_from_cents: priceCents,
        phone: phone.trim(),
        service_area: serviceArea.trim() || null,
        photo_url: photoUrl,
        // status is left at the column's own 'pending' default — an admin
        // approves or declines it from the Console before it goes live.
      })
      .select("id")
      .single();
    if (createErr) {
      setError(createErr.code === "23505" ? "A listing with that name already exists — search for it on the previous page instead." : createErr.message);
      setSubmitting(false);
      return;
    }

    const { error: catErr } = await supabase.from("supplier_categories").insert(categories.map((category) => ({ supplier_id: created.id, category })));
    if (catErr) {
      setError(`Listing created, but categories failed to save: ${catErr.message}`);
      setSubmitting(false);
      return;
    }

    navigate("/supplier");
  }

  const inputS = { background: T.panel2, color: T.ink, border: `1px solid ${T.border}` };
  const btnA = { background: T.accent, color: T.onAccent };

  if (checking) {
    return (
      <PortalShell title="Loading…">
        <PortalCard T={T}><span style={{ color: T.sub }}>Loading…</span></PortalCard>
      </PortalShell>
    );
  }

  return (
    <PortalShell eyebrow="Supplier" title="Set up your listing">
      <PortalCard T={T}>
        <div className="mb-3 flex items-center gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="h-1 flex-1 rounded-full" style={{ background: step >= i ? T.accent : rgba(T.ink, 0.1), transition: "background .3s" }} />
          ))}
        </div>
        <div className="text-xs font-bold" style={{ color: T.accent }}>Step {step + 1} of 6</div>
        <div style={{ fontFamily: "'Archivo Black',sans-serif", fontSize: 19 }}>{TITLES[step]}</div>
        <div className="mb-4 text-xs" style={{ color: T.sub }}>{SUBS[step]}</div>

        {step === 0 && (
          <div className="space-y-3">
            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Business name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bloom Room Florists" className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
            </label>
            <div>
              <div className="mb-1.5 text-xs font-bold" style={{ color: T.sub }}>PRIMARY CATEGORY</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPrimaryCategory(c)}
                    className="flex items-center justify-between gap-1 rounded-xl border p-2.5 text-left text-xs font-semibold"
                    style={{ borderColor: primaryCategory === c ? T.accent : T.border, background: primaryCategory === c ? rgba(T.accent, 0.1) : T.panel2 }}
                  >
                    {c}
                    {primaryCategory === c && <CheckCircle2 size={13} className="shrink-0" style={{ color: T.accent }} />}
                  </button>
                ))}
              </div>
            </div>
            {primaryCategory && (
              <div>
                <div className="mb-1.5 text-xs font-bold" style={{ color: T.sub }}>ALSO OFFER (optional)</div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.filter((c) => c !== primaryCategory).map((c) => {
                    const on = extraCategories.has(c);
                    return (
                      <button
                        key={c}
                        onClick={() => setExtraCategories((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; })}
                        className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                        style={{ borderColor: on ? T.accent : T.border, background: on ? T.accent : T.panel2, color: on ? T.onAccent : T.ink }}
                      >
                        {c}{on ? " ✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {primaryCategory && (
              <Effect T={T}>Clients searching <b>{primaryCategory}</b>{categories.length > 1 ? ` (and ${categories.length - 1} more)` : ""} will find you — categories can be changed anytime from your portal.</Effect>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Headline — one line</div>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Award-winning wedding photography across Gauteng" className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
            </label>
            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>About your business</div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What makes you the right choice — style, experience, what's included…" className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={{ ...inputS, minHeight: 110 }} />
            </label>
            <Effect T={T}>Your headline is the first thing a client sees on your card — the description shows once they open your full profile.</Effect>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {PRICING_UNITS.map((u) => (
                <button
                  key={u.key}
                  onClick={() => setPricingUnit(u.key)}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm"
                  style={{ borderColor: pricingUnit === u.key ? T.accent : T.border, background: pricingUnit === u.key ? rgba(T.accent, 0.1) : T.panel2 }}
                >
                  <div className="text-left">
                    <div className="font-semibold">{u.label}</div>
                    <div className="text-xs" style={{ color: T.sub }}>{u.hint}</div>
                  </div>
                  {pricingUnit === u.key && <CheckCircle2 size={16} className="shrink-0" style={{ color: T.accent }} />}
                </button>
              ))}
            </div>
            {pricingUnit !== "quote_only" && (
              <label className="block">
                <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Amount (R)</div>
                <input type="number" min={0} inputMode="decimal" value={priceRand} onChange={(e) => setPriceRand(e.target.value)} placeholder="0" className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
              </label>
            )}
            <Effect T={T}>Clients will see: <b>{preview}</b></Effect>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Phone number</div>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 82 000 0000" className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
            </label>
            <label className="block">
              <div className="mb-1 text-xs font-semibold" style={{ color: T.sub }}>Service area (optional)</div>
              <input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="e.g. Johannesburg & Pretoria" className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputS} />
            </label>
            <Effect T={T}>This is the number we message the moment a client requests you or responds to a quote — it's how leads actually reach you.</Effect>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <ImageUpload
              onFiles={handlePhotoFiles}
              multiple={false}
              disabled={uploadingPhoto}
              className="flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed text-center"
              style={{ borderColor: rgba(T.ink, 0.22), background: rgba(T.ink, 0.04), height: 180 }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <Camera size={22} style={{ color: T.faint }} />
                  <span className="text-xs font-semibold" style={{ color: T.sub }}>{uploadingPhoto ? "Uploading…" : "Add a cover photo"}</span>
                </>
              )}
            </ImageUpload>
            {photoUrl && <div className="text-center text-[11px]" style={{ color: T.faint }}>Tap the photo to replace it.</div>}
            <Effect T={T}>Listings with a real photo get more clicks than a placeholder — skip this and add one later from your portal if you'd rather.</Effect>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            {photoUrl && <img src={photoUrl} alt="" className="h-28 w-full rounded-xl object-cover" />}
            <div className="space-y-1.5 text-left text-xs">
              {([
                ["Business", name || "—", categories.join(", ") || "No category picked"],
                ["Offer", headline || "No headline yet", bio ? "Description added" : "No description yet"],
                ["Pricing", preview, "Shown on your listing"],
                ["Contact", phone || "No phone number yet", serviceArea || "No service area set"],
              ] as [string, string, string][]).map(([k, v, sub]) => (
                <div key={k} className="flex items-start gap-2 rounded-xl border px-3 py-2" style={{ borderColor: T.border, background: T.panel2 }}>
                  <div className="w-20 shrink-0 font-bold" style={{ color: T.faint }}>{k}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold" style={{ color: T.ink }}>{v}</div>
                    <div style={{ color: T.sub }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <Effect T={T}>Your listing goes to admin for a quick review — most are approved within a day, and we'll message you the moment it's live. You can request a verified badge anytime once it is.</Effect>
          </div>
        )}

        {error && <div className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: rgba(T.bad, 0.1), color: T.bad }}>{error}</div>}

        <div className="mt-5 flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: T.border, color: T.sub }}><ChevronLeft size={15} /></button>
          )}
          <button
            onClick={() => (step === 5 ? submit() : setStep((s) => s + 1))}
            disabled={!stepValid || submitting}
            className="press flex-1 rounded-xl py-2.5 text-sm font-bold disabled:opacity-60"
            style={btnA}
          >
            {submitting ? "Submitting…" : step === 5 ? "Submit for review" : "Next"}
          </button>
        </div>
      </PortalCard>
    </PortalShell>
  );
}
