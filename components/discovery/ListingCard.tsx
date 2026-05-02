"use client";

import Link from "next/link";
import { Heart, Star, ShieldCheck } from "lucide-react";
import type { PublicListing } from "../../lib/supabase/types";
import { formatRentCompact, cn } from "../../lib/utils";

type ListingCardProps = {
  listing: PublicListing;
  isHighlighted?: boolean;
  onHover?: () => void;
  onBlur?: () => void;
  onShortlist?: () => void;
  isShortlisted?: boolean;
};

const SHARING_LABEL: Record<string, string> = {
  single: "Single sharing",
  double: "Double sharing",
  triple: "Triple sharing",
  private_room: "Private room",
  whole: "Entire home",
};

export function ListingCard({
  listing,
  isHighlighted,
  onHover,
  onBlur,
  onShortlist,
  isShortlisted,
}: ListingCardProps) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      onMouseEnter={onHover}
      onMouseLeave={onBlur}
      className={cn(
        "group block touch-pan-y overflow-hidden rounded-3xl border border-transparent bg-white transition-all duration-200",
        "hover:border-ink-100 hover:shadow-cardHover",
        isHighlighted && "border-ink-100 shadow-cardHover"
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink-100">
        {listing.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.cover_image}
            alt={listing.title}
            draggable={false}
            className="h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-100 to-ink-50 text-ink-400">
            No photo yet
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onShortlist?.();
          }}
          className={cn(
            "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-md transition-colors",
            isShortlisted ? "bg-brand text-white" : "bg-white/85 text-ink-700 hover:bg-white"
          )}
          aria-label="Save"
        >
          <Heart className={cn("h-4 w-4", isShortlisted && "fill-current")} />
        </button>
        {listing.is_verified && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified
          </span>
        )}
        {listing.source_type === "aggregated" && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-sm">
            via {listing.source_name ?? "Aggregator"}
          </span>
        )}
      </div>
      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-ink-900">
              {listing.locality}, Kolkata
            </p>
            <p className="mt-0.5 truncate text-sm text-ink-500">{listing.title}</p>
          </div>
          {listing.k_score && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-900">
              <Star className="h-3.5 w-3.5 fill-current text-ink-900" />
              {(listing.k_score / 20).toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-500">
          {listing.bhk ? `${listing.bhk} BHK · ` : ""}
          {SHARING_LABEL[listing.sharing_type] ?? listing.sharing_type}
          {listing.square_feet ? ` · ${listing.square_feet} sq.ft` : ""}
        </p>
        {(listing.gated_society || listing.parking_count != null || listing.pet_policy) && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
            {listing.gated_society === true && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">🏘 Gated</span>
            )}
            {listing.gated_society === false && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium text-ink-700">🚪 Not gated</span>
            )}
            {listing.parking_count != null && listing.parking_count > 0 && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium text-ink-700">
                🚗 {listing.parking_count}
              </span>
            )}
            {listing.pet_policy === "yes" && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">🐕 Pet ok</span>
            )}
            {listing.tenant_type === "family" && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium text-ink-700">👨‍👩‍👧 Family</span>
            )}
            {listing.tenant_type === "bachelor" && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium text-ink-700">🎓 Bachelor</span>
            )}
          </p>
        )}
        <p className="mt-2 text-[15px]">
          <span className="font-semibold text-ink-900">{formatRentCompact(listing.rent)}</span>
          <span className="text-ink-500"> / month</span>
          {listing.includes_maintenance && (
            <span className="ml-2 text-[11px] text-ink-500">incl. maintenance</span>
          )}
        </p>
      </div>
    </Link>
  );
}
