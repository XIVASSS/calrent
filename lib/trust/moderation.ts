import type { PublicListing } from "../supabase/types";

export type ModerationAlert = {
  listingId: string;
  severity: "low" | "medium" | "high";
  type: "price_anomaly" | "duplicate_risk" | "missing_verification" | "content_review" | "low_confidence";
  message: string;
};

const PRICE_BAND_BY_BHK: Record<number, [number, number]> = {
  1: [7000, 25000],
  2: [12000, 45000],
  3: [18000, 65000],
  4: [30000, 120000],
};

export function generateModerationAlerts(listings: PublicListing[]): ModerationAlert[] {
  const alerts: ModerationAlert[] = [];

  listings.forEach((listing) => {
    if (!listing.is_verified) {
      alerts.push({
        listingId: listing.id,
        severity: "medium",
        type: "missing_verification",
        message: "Listing is unverified — request KYC before publish.",
      });
    }
    const band = listing.bhk ? PRICE_BAND_BY_BHK[Math.min(4, listing.bhk)] : null;
    if (band && (listing.rent < band[0] * 0.6 || listing.rent > band[1] * 1.6)) {
      alerts.push({
        listingId: listing.id,
        severity: "high",
        type: "price_anomaly",
        message: `Rent ₹${listing.rent} is outside the typical band ₹${band[0]}–₹${band[1]} for ${listing.bhk} BHK.`,
      });
    }
    if (listing.title.toLowerCase().match(/^(modern|luxury|premium)\s+\w+\s*$/)) {
      alerts.push({
        listingId: listing.id,
        severity: "low",
        type: "content_review",
        message: "Title looks generic; ask provider for floor, society, and amenities.",
      });
    }
  });

  return alerts;
}
