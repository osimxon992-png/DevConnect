import { createClient } from "@supabase/supabase-js";

// Used when the host (e.g. Vercel) has no env vars. Paste values from .env; the publishable key is public, RLS protects the data.
const FALLBACK_URL = "https://cmybrvqujsrrcvvyzbep.supabase.co";
const FALLBACK_KEY = "sb_publishable_SWx6bdNA5OdmjBPPWzn1Lg_XxpYHDYw";

const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

export const configured = Boolean(url && key);
export const supabase = createClient(
  url || "http://localhost",
  key || "missing",
);

// Uploads a file under the user's own folder (required by storage RLS) and returns its public URL.
export async function uploadFile(userId, file, folder = "misc") {
  if (file.size > 5 * 1024 * 1024) throw new Error("File must be under 5 MB");
  if (!file.type.startsWith("image/"))
    throw new Error("Only images are allowed");
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

// Throws on Supabase errors so callers can use one try/catch.
export async function q(promise) {
  const { data, error, count } = await promise;
  if (error) throw error;
  return count ?? data;
}
