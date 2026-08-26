import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";

export type EventImage = { name: string; path: string; url: string; sizeBytes: number; createdAt: string };

// Real upload for Vision's mood board (and, generalized, Documents' file
// list) — no metadata table needed. Storage itself is the source of truth:
// files live under "{auth.uid()}/{folder}/{timestamp}-{filename}" in the
// private "event-images" bucket (see 20260825130000_event_images_storage.sql
// for the RLS that scopes each folder to its owner), and this hook just
// lists that folder and mints a signed URL per file to display.
export function useEventImages(folder: string) {
  const { session } = useAuth();
  const [images, setImages] = useState<EventImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const uid = session?.user.id;

  const refresh = useCallback(async () => {
    if (!uid) { setImages([]); setLoading(false); return; }
    setLoading(true);
    const prefix = `${uid}/${folder}`;
    const { data: files, error } = await supabase.storage.from("event-images").list(prefix, { sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      console.error("useEventImages: failed to list", error.message);
      setImages([]);
      setLoading(false);
      return;
    }
    const paths = (files ?? []).map((f) => `${prefix}/${f.name}`);
    if (paths.length === 0) { setImages([]); setLoading(false); return; }
    const { data: signed, error: signErr } = await supabase.storage.from("event-images").createSignedUrls(paths, 3600);
    if (signErr) {
      console.error("useEventImages: failed to sign urls", signErr.message);
      setImages([]);
      setLoading(false);
      return;
    }
    setImages(
      (files ?? [])
        .map((f, i) => ({ name: f.name, path: paths[i], url: signed[i]?.signedUrl ?? "", sizeBytes: (f.metadata?.size as number) ?? 0, createdAt: f.created_at ?? "" }))
        .filter((im) => im.url),
    );
    setLoading(false);
  }, [uid, folder]);

  useEffect(() => { refresh(); }, [refresh]);

  async function upload(fileList: FileList | File[]): Promise<{ ok: number; failed: number }> {
    if (!uid) return { ok: 0, failed: 0 };
    setBusy(true);
    const files = Array.from(fileList);
    let ok = 0, failed = 0;
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${uid}/${folder}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: false });
      if (error) { console.error("useEventImages: upload failed", error.message); failed++; } else ok++;
    }
    await refresh();
    setBusy(false);
    return { ok, failed };
  }

  async function remove(path: string) {
    const { error } = await supabase.storage.from("event-images").remove([path]);
    if (error) { console.error("useEventImages: remove failed", error.message); return false; }
    await refresh();
    return true;
  }

  return { images, loading, busy, upload, remove };
}
