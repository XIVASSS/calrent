import type { PublicListing } from "../supabase/types";

export type RenterPreferenceProfile = {
  desiredBhk: number | null;
  maxBudget: number;
  amenities: string[];
  wantsNoBroker: boolean;
  nearMetroPriority: boolean;
  preferredSharing: string[];
  preferredGender: string | null;
};

export type CompatibilityResult = {
  listing: PublicListing;
  score: number;
  reasons: string[];
};

const NO_BROKER_SOURCES = new Set(["99acres", "magicbricks", "housing", "nobroker"]);

function isNoBroker(listing: PublicListing) {
  if (listing.source_type === "direct") return true;
  if (!listing.source_name) return true;
  return !NO_BROKER_SOURCES.has(listing.source_name.toLowerCase());
}

export function scoreCompatibility(
  listing: PublicListing,
  profile: RenterPreferenceProfile
): CompatibilityResult {
  let score = 35;
  const reasons: string[] = [];

  if (profile.desiredBhk && listing.bhk === profile.desiredBhk) {
    score += 18;
    reasons.push(`${listing.bhk} BHK matches preference`);
  }
  if (listing.rent <= profile.maxBudget) {
    score += 18;
    reasons.push("Within budget");
  } else if (listing.rent <= profile.maxBudget * 1.1) {
    score += 6;
    reasons.push("Slightly above budget");
  }
  if (profile.wantsNoBroker && isNoBroker(listing)) {
    score += 8;
    reasons.push("No broker fee");
  }
  if (profile.nearMetroPriority && (listing.k_score ?? 0) >= 80) {
    score += 12;
    reasons.push("Strong metro connectivity");
  }
  const amenityHits = profile.amenities.filter((a) =>
    (listing.amenities ?? []).map((x) => x.toLowerCase()).includes(a.toLowerCase())
  );
  if (amenityHits.length > 0) {
    score += Math.min(10, amenityHits.length * 3);
    reasons.push(`${amenityHits.length} preferred amenities matched`);
  }
  if (profile.preferredSharing.length > 0 && profile.preferredSharing.includes(listing.sharing_type)) {
    score += 6;
    reasons.push("Sharing preference matched");
  }
  if (profile.preferredGender && (listing.gender_pref === profile.preferredGender || listing.gender_pref === "any")) {
    score += 5;
  }
  if (listing.is_verified) {
    score += 4;
    reasons.push("Verified listing");
  }

  return {
    listing,
    score: Math.max(0, Math.min(100, score)),
    reasons,
  };
}

export function rankCompatibleListings(
  listings: PublicListing[],
  profile: RenterPreferenceProfile,
  limit = 12
) {
  return listings
    .map((listing) => scoreCompatibility(listing, profile))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
