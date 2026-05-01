import { getSupabaseServer, isSupabaseConfigured } from "./server";
import type { ProfileRow } from "./types";

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseServer();
  const userResponse = await supabase.auth.getUser();
  const user = userResponse.data.user;
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error || !data) return null;
  return data as ProfileRow;
}
