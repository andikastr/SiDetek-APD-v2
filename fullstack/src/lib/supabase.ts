import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Upload an image (base64 or Blob) to Supabase Storage bucket 'ppe-audit-images'.
 * If Supabase is not configured, returns the base64 string directly for inline storage.
 */
export async function uploadAuditImage(
  dataBase64: string,
  fileName: string
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    // Fallback: return data URI as-is for local development without Supabase setup
    return dataBase64.startsWith("data:") ? dataBase64 : `data:image/jpeg;base64,${dataBase64}`;
  }

  try {
    const cleanBase64 = dataBase64.includes(",") ? dataBase64.split(",")[1] : dataBase64;
    const buffer = Buffer.from(cleanBase64, "base64");
    const path = `audits/${Date.now()}_${fileName}`;

    const { data, error } = await supabase.storage
      .from("ppe-audit-images")
      .upload(path, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.warn("Supabase upload error, falling back to data URL:", error.message);
      return dataBase64.startsWith("data:") ? dataBase64 : `data:image/jpeg;base64,${dataBase64}`;
    }

    const { data: publicData } = supabase.storage
      .from("ppe-audit-images")
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (err) {
    console.error("Failed to upload image to Supabase:", err);
    return dataBase64.startsWith("data:") ? dataBase64 : `data:image/jpeg;base64,${dataBase64}`;
  }
}
