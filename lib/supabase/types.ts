export type ListingStatus = "draft" | "pending_review" | "live" | "rejected" | "archived";
export type SourceType = "direct" | "aggregated";
export type SharingType = "single" | "double" | "triple" | "private_room" | "whole";
export type FurnishingStatus = "furnished" | "semi_furnished" | "unfurnished";
export type GenderPref = "any" | "male" | "female" | "couple_friendly";
export type ContactRequestStatus = "pending" | "accepted" | "declined" | "revoked" | "expired";
export type UserRole = "seeker" | "provider" | "both" | "admin";
export type ModerationStatus = "queued" | "approved" | "rejected" | "needs_changes";

export type ListingRow = {
  id: string;
  provider_id: string | null;
  title: string;
  description: string | null;
  property_type: "flat" | "room" | "pg" | "studio";
  bhk: number | null;
  rooms_count: number | null;
  sharing_type: SharingType;
  occupancy_max: number | null;
  rent: number;
  deposit: number | null;
  maintenance: number | null;
  furnished_status: FurnishingStatus;
  available_from: string | null;
  locality: string;
  area_slug: string;
  city: string;
  lat: number;
  lng: number;
  gender_pref: GenderPref;
  restrictions: Record<string, unknown> | null;
  amenities: string[] | null;
  source_type: SourceType;
  source_name: string | null;
  source_url: string | null;
  source_contact_name: string | null;
  source_contact_phone: string | null;
  source_contact_email: string | null;
  publish_status: ListingStatus;
  is_verified: boolean;
  k_score: number | null;
  cover_image: string | null;
  gated_society: boolean | null;
  square_feet: number | null;
  parking_count: number | null;
  pet_policy: "yes" | "no" | "unsure" | null;
  tenant_type: "family" | "bachelor" | "any" | null;
  includes_maintenance: boolean | null;
  food_pref: "any" | "veg" | "nonveg" | null;
  one_liner: string | null;
  created_at: string;
  updated_at: string;
};

export type SeekerPinRow = {
  id: string;
  user_id: string | null;
  looking_for: "flat" | "room" | "flatmate" | "pg" | "any";
  budget: number;
  bhk_pref: number | null;
  move_in:
    | "immediately"
    | "within_15_days"
    | "within_30_days"
    | "within_60_days"
    | "flexible"
    | null;
  flatmate_food_pref: "any" | "veg" | "nonveg" | null;
  smoking_ok: boolean | null;
  self_gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  flatmate_gender_pref:
    | "any"
    | "male"
    | "female"
    | "same_as_self"
    | "couple_friendly"
    | null;
  parking_required: boolean | null;
  lifestyle_text: string | null;
  email: string;
  phone: string;
  lat: number;
  lng: number;
  status: "active" | "matched" | "closed";
  created_at: string;
};

export type PublicSeekerPin = Omit<SeekerPinRow, "email" | "phone" | "user_id">;

export type PublicListing = Omit<
  ListingRow,
  "source_contact_name" | "source_contact_phone" | "source_contact_email"
> & {
  has_contact: boolean;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  trust_score: number;
  created_at: string;
  updated_at: string;
};

export type ContactRequestRow = {
  id: string;
  listing_id: string;
  requester_id: string;
  provider_id: string;
  message: string | null;
  status: ContactRequestStatus;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

export type ListingImageRow = {
  id: string;
  listing_id: string;
  storage_path: string;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
};

export type IngestedRecordRow = {
  id: string;
  source_name: string;
  external_id: string | null;
  raw_payload: Record<string, unknown>;
  normalized_payload: Record<string, unknown> | null;
  dedupe_key: string | null;
  confidence: number | null;
  status: ModerationStatus;
  reviewer_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
