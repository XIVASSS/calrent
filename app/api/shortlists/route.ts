import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, isSupabaseConfigured } from "../../../lib/supabase/server";

const schema = z.object({ listingId: z.string().uuid(), action: z.enum(["add", "remove"]) });

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 422 });

  const supabase = getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  if (parsed.data.action === "add") {
    const { error } = await supabase
      .from("shortlists")
      .upsert({ user_id: data.user.id, listing_id: parsed.data.listingId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("shortlists")
      .delete()
      .eq("user_id", data.user.id)
      .eq("listing_id", parsed.data.listingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ items: [] });
  const { data: items } = await supabase
    .from("shortlists")
    .select("listing_id")
    .eq("user_id", data.user.id);
  return NextResponse.json({ items: items?.map((r) => r.listing_id) ?? [] });
}
