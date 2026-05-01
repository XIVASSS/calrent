import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "../../../lib/supabase/server";
import { listingDraftSchema } from "../../../lib/listings/schema";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

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
  const parsed = listingDraftSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 422 });
  }
  const supabase = getSupabaseServer();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const draft = parsed.data;
  const insertPayload = {
    provider_id: userResult.user.id,
    title: draft.title,
    description: draft.description,
    property_type: draft.property_type,
    bhk: draft.bhk ?? null,
    rooms_count: draft.rooms_count ?? null,
    sharing_type: draft.sharing_type,
    occupancy_max: draft.occupancy_max ?? null,
    rent: draft.rent,
    deposit: draft.deposit ?? null,
    maintenance: draft.maintenance ?? null,
    furnished_status: draft.furnished_status,
    available_from: draft.available_from ?? null,
    locality: draft.locality,
    area_slug: draft.area_slug || slugify(draft.locality),
    city: draft.city ?? "Kolkata",
    lat: draft.lat,
    lng: draft.lng,
    gender_pref: draft.gender_pref,
    amenities: draft.amenities,
    restrictions: draft.restrictions,
    cover_image: draft.cover_image ?? null,
    source_type: "direct" as const,
    source_contact_name: draft.source_contact_name,
    source_contact_phone: draft.source_contact_phone,
    source_contact_email: draft.source_contact_email ?? null,
    publish_status: "live" as const,
    is_verified: false,
  };

  const { data, error } = await supabase
    .from("listings")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
