"use client";

import Link from "next/link";
import { ShieldCheck, Star, ArrowUpRight, BedDouble, Maximize2 } from "lucide-react";
import type { PublicListing } from "../../lib/supabase/types";
import { formatRentCompact } from "../../lib/utils";

type Props = {
  listing: PublicListing;
};

const SHARING_LABEL: Record<string, string> = {
  single: "Single sharing",
  double: "Double sharing",
  triple: "Triple sharing",
  private_room: "Private room",
  whole: "Entire home",
};

export function ListingPopupCard({ listing }: Props) {
  return (
    <div className="w-[300px] overflow-hidden rounded-2xl bg-white">
      <div className="relative h-44 w-full overflow-hidden bg-ink-100">
        {listing.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.cover_image}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {listing.is_verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
          {listing.gated_society && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-ink-700 shadow-sm">
              🏘 Gated
            </span>
          )}
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <div className="text-white drop-shadow">
            <p className="text-[11px] font-medium uppercase tracking-wide opacity-90">
              {listing.locality}
            </p>
            <p className="text-2xl font-semibold leading-tight">
              {formatRentCompact(listing.rent)}
              <span className="ml-1 text-xs font-medium opacity-80">/ mo</span>
            </p>
          </div>
          {listing.k_score && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-ink-900 shadow-sm">
              <Star className="h-3 w-3 fill-current" /> {(listing.k_score / 20).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 p-3">
        <p className="line-clamp-1 text-[13px] font-semibold text-ink-900">
          {listing.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-600">
          {listing.bhk != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 font-medium">
              <BedDouble className="h-3 w-3" /> {listing.bhk} BHK
            </span>
          )}
          {listing.square_feet && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 font-medium">
              <Maximize2 className="h-3 w-3" /> {listing.square_feet} sqft
            </span>
          )}
          {listing.parking_count != null && listing.parking_count > 0 && (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium">
              🚗 {listing.parking_count}
            </span>
          )}
          {listing.pet_policy === "yes" && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
              🐕 Pet ok
            </span>
          )}
          {listing.tenant_type === "family" && (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium">👨‍👩‍👧 Family</span>
          )}
          {listing.tenant_type === "bachelor" && (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium">🎓 Bachelor</span>
          )}
        </div>
        <p className="line-clamp-2 text-[11px] text-ink-500">
          {listing.one_liner || listing.description || SHARING_LABEL[listing.sharing_type]}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-ink-500">
            {listing.source_type === "aggregated" && listing.source_name
              ? `via ${listing.source_name}`
              : "Direct from owner"}
          </span>
          <Link
            href={`/listing/${listing.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-800"
          >
            View details <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
