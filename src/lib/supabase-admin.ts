import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const POST_IMAGES_BUCKET = "post-images";

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

let cachedClient: SupabaseClient | null = null;

/**
 * Reads storage config lazily so a missing env var never crashes module import
 * or build. Uploads degrade to a clear 503 instead.
 */
function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

export function isStorageConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

/**
 * Server-only admin client. The service-role key bypasses storage RLS, so this
 * must never be imported from a client component.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cachedClient = createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

/**
 * Builds the public URL for an object stored in the post-images bucket.
 * Returns null when storage is not configured.
 */
export function buildPublicImageUrl(path: string): string | null {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return `${config.url}/storage/v1/object/public/${POST_IMAGES_BUCKET}/${path}`;
}
