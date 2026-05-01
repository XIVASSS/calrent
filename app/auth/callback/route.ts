import { NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(next, request.url));
  }

  const supabase = getSupabaseServer();
  await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(next, request.url));
}
