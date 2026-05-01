"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let cached: SupabaseClient | null = null;

export function isSupabaseClientConfigured() {
  return Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON);
}

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseClientConfigured()) return null;
  if (cached) return cached;
  cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
  return cached;
}
