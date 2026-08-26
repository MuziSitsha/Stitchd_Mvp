import { FileText, Upload, X, Loader2 } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/theme";
import { Card } from "../../components/proto/Card";
import { ImageUpload } from "../../components/proto/ImageUpload";
import { DOCS_SEED } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { useEventImages } from "../../state/useEventImages";
import type { Theme } from "../../theme/theme";

const STATE_TONE = (T: Theme, s: string) =>
  s === "Signed" ? T.good : s === "Needs you" ? T.bad : s === "In review" ? T.gold : s === "Live" ? T.info : T.faint;

function fmtSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

// Us > Documents — DOCS_SEED (data.ts) stays as the seeded paper trail, and
// real uploads (via useEventImages, same Storage bucket as Vision's mood
// board, generalized to accept PDFs too) render as real rows above it —
// same list, one real, one seeded, told apart by "You" as the supplier.
export function Documents() {
  const { T } = useTheme();
  const { toast } = useProtoState();
  const { images, busy, upload, remove } = useEventImages("documents");
  const needsYou = DOCS_SEED.filter((d) => d.state === "Needs you");

  async function handleFiles(files: FileList) {
    const { ok, failed } = await upload(files);
    if (ok > 0) toast(`${ok} document${ok > 1 ? "s" : ""} uploaded`);
    if (failed > 0) toast(`${failed} upload${failed > 1 ? "s" : ""} failed`, "warn");
  }

  return (
    <div className="rise space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-bold">{needsYou.length > 0 ? `${needsYou.length} document${needsYou.length > 1 ? "s" : ""} need${needsYou.length === 1 ? "s" : ""} your signature.` : "Nothing needs your signature right now."} The other {DOCS_SEED.length - needsYou.length} are safe here.</div>
        <ImageUpload onFiles={handleFiles} disabled={busy} accept="application/pdf,image/*" className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#1A1726", color: "#fff" }}>
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}Upload a document
        </ImageUpload>
      </div>

      <Card T={T} className="!p-0 overflow-hidden">
        <div className="hidden gap-3 border-b px-4 py-2.5 text-xs font-bold sm:grid" style={{ gridTemplateColumns: "56px 1.8fr 1fr 90px 80px 110px", borderColor: T.border, background: T.panel2, color: T.sub }}>
          <span>Kind</span><span>Name</span><span>Supplier</span><span>Added</span><span>Size</span><span className="text-right">State</span>
        </div>
        {images.map((im, i) => (
          <div key={im.path} className="group flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-xs sm:grid sm:flex-nowrap" style={{ gridTemplateColumns: "56px 1.8fr 1fr 90px 80px 110px", borderTop: i ? `1px solid ${T.border}` : undefined }}>
            <span className="flex items-center gap-1.5 font-bold" style={{ color: T.sub }}><FileText size={12} />{im.name.split(".").pop()?.toUpperCase() ?? "FILE"}</span>
            <a href={im.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-bold hover:underline sm:flex-none">{im.name.replace(/^\d+-/, "")}</a>
            <span className="truncate" style={{ color: T.sub }}>You</span>
            <span className="tnum hidden sm:block" style={{ color: T.faint }}>{fmtDate(im.createdAt)}</span>
            <span className="tnum hidden sm:block" style={{ color: T.faint }}>{fmtSize(im.sizeBytes)}</span>
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0 sm:justify-self-end">
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: rgba(T.info, 0.14), color: T.info }}>Yours</span>
              <button aria-label="Remove document" onClick={() => remove(im.path)} className="opacity-0 group-hover:opacity-100" style={{ color: T.faint }}><X size={13} /></button>
            </div>
          </div>
        ))}
        {DOCS_SEED.map((d, i) => (
          <div key={d.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-xs sm:grid sm:flex-nowrap" style={{ gridTemplateColumns: "56px 1.8fr 1fr 90px 80px 110px", borderTop: i || images.length ? `1px solid ${T.border}` : undefined }}>
            <span className="flex items-center gap-1.5 font-bold" style={{ color: T.sub }}><FileText size={12} />{d.kind}</span>
            <span className="min-w-0 flex-1 truncate font-bold sm:flex-none">{d.name}</span>
            <span className="truncate" style={{ color: T.sub }}>{d.supplier}</span>
            <span className="tnum hidden sm:block" style={{ color: T.faint }}>{d.added}</span>
            <span className="tnum hidden sm:block" style={{ color: T.faint }}>{d.size}</span>
            <span className="ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:ml-0 sm:justify-self-end" style={{ background: rgba(STATE_TONE(T, d.state), 0.14), color: STATE_TONE(T, d.state) }}>{d.state}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
