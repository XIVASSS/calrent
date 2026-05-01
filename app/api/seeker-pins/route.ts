import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, isSupabaseConfigured } from "../../../lib/supabase/server";

const schema = z.object({
  lookingFor: z.enum(["flat", "room", "flatmate", "pg", "any"]),
  budget: z.number().int().min(1000).max(2_000_000),
  bhkPref: z.number().int().min(1).max(10).nullish(),
  moveIn: z
    .enum(["immediately", "within_15_days", "within_30_days", "within_60_days", "flexible"])
    .nullish(),
  flatmateFood: z.enum(["any", "veg", "nonveg"]).nullish(),
  smokingOk: z.boolean().nullish(),
  selfGender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullish(),
  flatmateGenderPref: z
    .enum(["any", "male", "female", "same_as_self", "couple_friendly"])
    .nullish(),
  parkingRequired: z.boolean().nullish(),
  lifestyleText: z.string().max(2000).nullish(),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/),
  lat: z.number().min(22.3).max(22.85),
  lng: z.number().min(88.1).max(88.7),
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
  const data = parsed.data;
  const supabase = getSupabaseServer();
  const { data: id, error } = await supabase.rpc("quick_add_seeker_pin", {
    p_looking_for: data.lookingFor,
    p_budget: data.budget,
    p_bhk_pref: data.bhkPref ?? null,
    p_move_in: data.moveIn ?? null,
    p_flatmate_food_pref: data.flatmateFood ?? null,
    p_smoking_ok: data.smokingOk ?? null,
    p_self_gender: data.selfGender ?? null,
    p_flatmate_gender_pref: data.flatmateGenderPref ?? null,
    p_parking_required: data.parkingRequired ?? null,
    p_lifestyle_text: data.lifestyleText ?? null,
    p_email: data.email,
    p_phone: data.phone,
    p_lat: data.lat,
    p_lng: data.lng,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ id });
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ pins: [] });
  }
  const url = new URL(req.url);
  const minLat = Number(url.searchParams.get("minLat") ?? "22.42");
  const minLng = Number(url.searchParams.get("minLng") ?? "88.25");
  const maxLat = Number(url.searchParams.get("maxLat") ?? "22.7");
  const maxLng = Number(url.searchParams.get("maxLng") ?? "88.55");
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.rpc("search_seeker_pins", {
    p_min_lat: minLat,
    p_min_lng: minLng,
    p_max_lat: maxLat,
    p_max_lng: maxLng,
    p_limit: 200,
  });
  if (error) {
    return NextResponse.json({ pins: [], error: error.message }, { status: 200 });
  }
  return NextResponse.json({ pins: data ?? [] });
}
