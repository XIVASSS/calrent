import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, isSupabaseConfigured } from "../../../../lib/supabase/server";

const schema = z.object({
  bhk: z.number().int().min(1).max(10),
  rent: z.number().int().min(1000).max(2_000_000),
  furnishing: z.enum(["furnished", "unfurnished"]),
  includesMaintenance: z.boolean().nullish(),
  gated: z.boolean(),
  tenant: z.enum(["family", "bachelor", "any"]).nullish(),
  deposit: z.number().int().min(0).max(5_000_000).nullish(),
  pets: z.enum(["yes", "no", "unsure"]).nullish(),
  parkingCount: z.number().int().min(0).max(20),
  squareFeet: z.number().int().min(50).max(20000).nullish(),
  email: z.string().email().nullish(),
  oneLiner: z.string().max(280).nullish(),
  locality: z.string().max(120).nullish(),
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
  const { data: id, error } = await supabase.rpc("quick_add_flat", {
    p_bhk: data.bhk,
    p_rent: data.rent,
    p_lat: data.lat,
    p_lng: data.lng,
    p_furnished: data.furnishing,
    p_includes_maintenance: data.includesMaintenance ?? false,
    p_gated: data.gated,
    p_tenant_type: data.tenant ?? "any",
    p_deposit: data.deposit ?? null,
    p_pet_policy: data.pets ?? null,
    p_parking_count: data.parkingCount,
    p_square_feet: data.squareFeet ?? null,
    p_email: data.email ?? null,
    p_one_liner: data.oneLiner ?? null,
    p_locality: data.locality ?? null,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ id });
}
