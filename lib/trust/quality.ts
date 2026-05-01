import type { PublicListing } from "../supabase/types";

export type ListingQuality = {
  listingId: string;
  score: number;
  reasons: string[];
  riskFlags: string[];
};

const NO_BROKER_SOURCES = new Set(["99acres", "magicbricks", "housing", "nobroker"]);

export function scoreListingQuality(listing: PublicListing): ListingQuality {
  let score = 50;
  const reasons: string[] = [];
  const riskFlags: string[] = [];

  if (listing.is_verified) {
    score += 18;
    reasons.push("Profile and listing documents verified");
  } else {
    riskFlags.push("Listing has not been verified");
  }
  if ((listing.k_score ?? 0) >= 85) {
    score += 10;
    reasons.push("Excellent metro and commute proximity");
  }
  if (listing.source_type === "direct") {
    score += 8;
    reasons.push("Direct owner listing");
  } else if (listing.source_name && NO_BROKER_SOURCES.has(listing.source_name.toLowerCase())) {
    riskFlags.push(`Aggregated from ${listing.source_name}; verify identity before sharing details`);
  }
  if (listing.deposit && listing.deposit > listing.rent * 3) {
    score -= 10;
    riskFlags.push("Security deposit appears high for the market");
  }
  if (!listing.cover_image) {
    score -= 6;
    riskFlags.push("No cover image uploaded");
  }
  if (listing.amenities && listing.amenities.length >= 5) {
    score += 4;
    reasons.push("Detailed amenities disclosed");
  }
  if (!listing.description || listing.description.length < 80) {
    score -= 6;
    riskFlags.push("Description is too short for confident moderation");
  }

  score = Math.max(0, Math.min(100, score));
  return { listingId: listing.id, score, reasons, riskFlags };
}
