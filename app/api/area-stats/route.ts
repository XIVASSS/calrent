import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, isSupabaseConfigured } from "../../../lib/supabase/server";

const schema = z.object({
  minLat: z.number().min(22).max(23),
  minLng: z.number().min(87).max(89),
  maxLat: z.number().min(22).max(23),
  maxLng: z.number().min(87).max(89),
  onlyGated: z.boolean().nullish(),
});

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.rpc("area_listing_stats", {
    p_min_lat: parsed.data.minLat,
    p_min_lng: parsed.data.minLng,
    p_max_lat: parsed.data.maxLat,
    p_max_lng: parsed.data.maxLng,
    p_only_gated: parsed.data.onlyGated ?? null,
  });
  if (error) {
    return NextResponse.json({ error: error.message, stats: [] }, { status: 200 });
  }
  return NextResponse.json({ stats: data ?? [] });
}
