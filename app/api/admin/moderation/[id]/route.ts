import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, isSupabaseConfigured } from "../../../../../lib/supabase/server";

const schema = z.object({
  decision: z.enum(["approve", "reject", "needs_changes"]),
  notes: z.string().max(500).nullable().optional(),
});

async function ensureAdmin() {
  const supabase = getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") return null;
  return supabase;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }
  const supabase = await ensureAdmin();
  if (!supabase) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 422 });

  const { data: record, error: fetchError } = await supabase
    .from("ingested_records")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (fetchError || !record) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (parsed.data.decision === "reject") {
    await supabase
      .from("ingested_records")
      .update({ status: "rejected", notes: parsed.data.notes ?? null })
      .eq("id", record.id);
    return NextResponse.json({ ok: true, status: "rejected" });
  }
  if (parsed.data.decision === "needs_changes") {
    await supabase
      .from("ingested_records")
      .update({ status: "needs_changes", notes: parsed.data.notes ?? null })
      .eq("id", record.id);
    return NextResponse.json({ ok: true, status: "needs_changes" });
  }

  // approve: turn ingested record into a real listing.
  const norm = (record.normalized_payload ?? {}) as Record<string, unknown>;
  const insertPayload = {
    title: norm.title as string,
    description: norm.description as string,
    property_type: ((norm.property_type as string) ?? "flat") as "flat",
    bhk: (norm.bhk as number) ?? null,
    rooms_count: (norm.rooms as number) ?? null,
    sharing_type: (norm.sharing as string) ?? "whole",
    occupancy_max: (norm.occupancy_max as number) ?? null,
    rent: norm.rent as number,
    deposit: (norm.deposit as number) ?? null,
    maintenance: null,
    furnished_status: (norm.furnishing as string) ?? "semi_furnished",
    available_from: null,
    locality: norm.locality as string,
    area_slug: norm.area_slug as string,
    city: "Kolkata",
    lat: norm.lat as number,
    lng: norm.lng as number,
    gender_pref: (norm.genderPref as string) ?? "any",
    amenities: (norm.amenities as string[]) ?? [],
    restrictions: (norm.restrictions as Record<string, unknown>) ?? {},
    source_type: "aggregated" as const,
    source_name: norm.source as string,
    source_url: (norm.url as string) ?? null,
    source_contact_name: (norm.contactName as string) ?? null,
    source_contact_phone: (norm.contactPhone as string) ?? null,
    source_contact_email: (norm.contactEmail as string) ?? null,
    publish_status: "live" as const,
    is_verified: false,
    k_score: (norm.kScore as number) ?? null,
  };

  const { error: insertError } = await supabase.from("listings").insert(insertPayload);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("ingested_records")
    .update({ status: "approved", notes: parsed.data.notes ?? null })
    .eq("id", record.id);

  return NextResponse.json({ ok: true, status: "approved" });
}
