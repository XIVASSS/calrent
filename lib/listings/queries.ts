import { getSupabaseServer, isSupabaseConfigured } from "../supabase/server";
import type { PublicListing, ListingRow } from "../supabase/types";
import { z } from "zod";

export const listingSearchSchema = z.object({
  minLat: z.number(),
  minLng: z.number(),
  maxLat: z.number(),
  maxLng: z.number(),
  minRent: z.number().int().nullable().optional(),
  maxRent: z.number().int().nullable().optional(),
  bhk: z.array(z.number().int().min(0).max(10)).nullable().optional(),
  sharing: z.array(z.string()).nullable().optional(),
  furnishing: z.array(z.string()).nullable().optional(),
  gender: z.string().nullable().optional(),
  noBroker: z.boolean().nullable().optional(),
  query: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export type ListingSearchParams = z.infer<typeof listingSearchSchema>;

export const KOLKATA_DEFAULT_BOUNDS: ListingSearchParams = {
  minLat: 22.42,
  minLng: 88.25,
  maxLat: 22.7,
  maxLng: 88.55,
  limit: 500,
};

function toPublicListing(row: ListingRow): PublicListing {
  const has_contact = Boolean(
    row.source_contact_phone || row.source_contact_email || row.source_contact_name
  );
  const {
    source_contact_name: _name,
    source_contact_phone: _phone,
    source_contact_email: _email,
    ...rest
  } = row;
  return { ...rest, has_contact };
}

export async function searchListings(input: ListingSearchParams): Promise<PublicListing[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServer();
  const params = listingSearchSchema.parse(input);

  const { data, error } = await supabase.rpc("search_live_listings", {
    p_min_lat: params.minLat,
    p_min_lng: params.minLng,
    p_max_lat: params.maxLat,
    p_max_lng: params.maxLng,
    p_min_rent: params.minRent ?? null,
    p_max_rent: params.maxRent ?? null,
    p_bhk: params.bhk && params.bhk.length ? params.bhk : null,
    p_sharing: params.sharing && params.sharing.length ? params.sharing : null,
    p_furnishing: params.furnishing && params.furnishing.length ? params.furnishing : null,
    p_gender: params.gender ?? null,
    p_no_broker: params.noBroker ?? null,
    p_query: params.query && params.query.trim() ? params.query.trim() : null,
    p_limit: params.limit ?? 200,
  });

  if (error) {
    console.error("[searchListings] error", error.message);
    return [];
  }

  type Row = ListingRow & { has_contact?: boolean };
  return ((data as Row[]) ?? []).map((row) => ({
    ...row,
    has_contact: Boolean(row.has_contact ?? false),
    restrictions: row.restrictions ?? null,
    source_contact_name: null,
    source_contact_phone: null,
    source_contact_email: null,
    gated_society: row.gated_society ?? null,
    square_feet: row.square_feet ?? null,
    parking_count: row.parking_count ?? null,
    pet_policy: row.pet_policy ?? null,
    tenant_type: row.tenant_type ?? null,
    includes_maintenance: row.includes_maintenance ?? null,
    food_pref: row.food_pref ?? null,
    one_liner: row.one_liner ?? null,
  })) as unknown as PublicListing[];
}

export async function getListingById(id: string): Promise<PublicListing | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, provider_id, title, description, property_type, bhk, rooms_count, sharing_type, occupancy_max, rent, deposit, maintenance, furnished_status, available_from, locality, area_slug, city, lat, lng, gender_pref, restrictions, amenities, source_type, source_name, source_url, publish_status, is_verified, k_score, cover_image, gated_society, square_feet, parking_count, pet_policy, tenant_type, includes_maintenance, food_pref, one_liner, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toPublicListing({
    ...(data as ListingRow),
    source_contact_name: null,
    source_contact_phone: null,
    source_contact_email: null,
  });
}

export async function getMyListings(userId: string): Promise<ListingRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("provider_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ListingRow[];
}
