import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// null when env vars are missing, so the app still runs offline/in dev.
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export async function pingSupabase(): Promise<string> {
  if (!supabase) return "Offline mode (no Supabase keys set)";
  const { error } = await supabase.from("scores").select("id", { head: true, count: "exact" });
  return error ? `Supabase error: ${error.message}` : "Connected to Supabase";
}
