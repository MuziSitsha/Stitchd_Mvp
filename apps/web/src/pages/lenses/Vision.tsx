import { useState } from "react";
import { ImagePlus, Copy, Check, Sparkles, X, Loader2 } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { Face } from "../../components/proto/Face";
import { ImageUpload } from "../../components/proto/ImageUpload";
import { PALETTES, PALETTE_ROLES } from "../../theme/palettes";
import { MOODBOARD_SEED, VISION_BRIEF, WEDDING } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { useEventImages } from "../../state/useEventImages";
import type { LensKey } from "../../components/proto/AppShell";

// Us > Vision — the mood board uploads real photos to Supabase Storage
// (useEventImages, bucket "event-images", RLS-scoped per owner). Uploaded
// tiles render first; any of MOODBOARD_SEED's category labels not yet
// covered by an upload still show as an empty dashed placeholder — clicking
// one opens the same file picker as "Add images", it's just labelled with
// what's still missing. The colour story reuses the app's real palette
// system, and "who has looked at this" reuses the real palette-bound
// suppliers (PALETTE_ROLES) instead of inventing a second, disconnected
// engagement metric.
export function Vision({ setLens }: { setLens: (l: LensKey) => void }) {
  const { T, pal } = useTheme();
  const { sup, toast } = useProtoState();
  const { images, loading, busy, upload, remove } = useEventImages("moodboard");
  const [copied, setCopied] = useState(false);
  const P = PALETTES[pal];

  async function handleFiles(files: FileList) {
    const { ok, failed } = await upload(files);
    if (ok > 0) toast(`${ok} image${ok > 1 ? "s" : ""} added to your mood board`);
    if (failed > 0) toast(`${failed} image${failed > 1 ? "s" : ""} failed to upload`, "warn");
  }

  const boundSuppliers = Object.keys(PALETTE_ROLES)
    .map((role) => sup.find((s) => s.role === role))
    .filter((s): s is NonNullable<typeof s> => !!s);

  function copyShareLink() {
    navigator.clipboard?.writeText(`https://stitchd.co.za/${WEDDING.couple.toLowerCase().replace(/\s*&\s*/g, "-")}/vision`).then(() => {
      setCopied(true);
      toast("Read-only link copied — no budget or guest list included");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rise grid gap-3 lg:grid-cols-[1fr_300px] lg:items-start">
      <div className="space-y-3">
        <Card T={T}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-bold">Your mood board</div>
              <div className="text-xs" style={{ color: T.sub }}>Drop images straight in — your palette-bound suppliers see this board.</div>
            </div>
            <ImageUpload onFiles={handleFiles} disabled={busy} className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#1A1726", color: "#fff" }}>
              {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}Add images
            </ImageUpload>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {images.map((im) => (
              <div key={im.path} className="group relative overflow-hidden rounded-xl" style={{ height: 130, background: T.panel2 }}>
                <img src={im.url} alt="" className="h-full w-full object-cover" />
                <button
                  aria-label="Remove image"
                  onClick={() => remove(im.path)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: "rgba(5,5,10,0.65)", color: "#fff" }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {!loading && MOODBOARD_SEED.slice(Math.max(0, images.length)).map((m) => (
              <ImageUpload key={m.id} onFiles={handleFiles} disabled={busy} className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center" style={{ borderColor: rgba(T.ink, 0.22), background: rgba(T.ink, 0.04), height: 130 }}>
                <ImagePlus size={20} style={{ color: T.faint }} />
                <span className="px-2 text-xs font-bold" style={{ color: T.sub }}>{m.label}</span>
              </ImageUpload>
            ))}
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-[1fr_1.3fr]">
          <Card T={T}>
            <div className="mb-2 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>YOUR COLOURS</div>
            <div className="grid grid-cols-3 gap-2">
              {P.cols.map((c) => (
                <div key={c}>
                  <div className="overflow-hidden rounded-lg" style={{ height: 56, background: c }} />
                  <div className="tnum mt-1 text-[10px]" style={{ color: T.faint }}>{c}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs leading-relaxed" style={{ color: T.sub }}>Shared with your florist, cake and décor suppliers so nobody has to guess what "{P.name.toLowerCase()}" means.</div>
          </Card>

          <Card T={T} style={{ background: "#1A1726", borderColor: "#1A1726" }}>
            <div className="text-xs font-bold" style={{ color: "#8F87A3", letterSpacing: 1 }}>THREE WORDS FOR THE DAY</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {VISION_BRIEF.words.map((w) => (
                <span key={w} className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: rgba("#fff", 0.1), color: "#fff" }}>{w}</span>
              ))}
            </div>
            <div className="mt-2.5 text-xs leading-relaxed" style={{ color: rgba("#fff", 0.75) }}>"{VISION_BRIEF.note}"</div>
            <button onClick={() => setLens("ourday")} className="mt-3 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#F2C14E", color: "#3A2A05" }}>See it reflected in Our day</button>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <Card T={T}>
          <div className="mb-2 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>WHO HAS LOOKED AT THIS</div>
          <div className="space-y-2.5">
            {boundSuppliers.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5">
                <Face seed={s.id} T={T} size={30} name={s.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold">{s.name}</div>
                  <div className="truncate text-[11px]" style={{ color: T.sub }}>Builds the {PALETTE_ROLES[s.role]} to this palette</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card T={T} style={{ background: rgba(T.gold, 0.1), borderColor: rgba(T.gold, 0.5) }}>
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: T.warn, letterSpacing: 1 }}><Sparkles size={12} />LUNGI'S READ ON YOUR BOARD</div>
          <div className="mt-1.5 text-xs leading-relaxed" style={{ color: T.ink }}>{P.name} reads warm and low-lit — lovely after dark, but {WEDDING.venue.split(",")[0]}'s ceremony is early afternoon in full sun. Worth two daytime references so your florist doesn't over-order candles.</div>
        </Card>

        <Card T={T}>
          <div className="mb-1.5 text-xs font-bold" style={{ color: T.faint, letterSpacing: 1 }}>SHARE IT</div>
          <div className="text-xs" style={{ color: T.sub }}>Send a read-only link to a supplier or a parent, without giving them your budget or guest list.</div>
          <button onClick={copyShareLink} className="mt-2.5 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: T.panel2, color: T.ink }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copied" : "Copy share link"}
          </button>
        </Card>
      </div>
    </div>
  );
}
