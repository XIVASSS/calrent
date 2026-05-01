"use client";

import { OverlayView, OverlayViewF } from "@react-google-maps/api";
import { formatRentCompact, cn } from "../../lib/utils";

type PriceMarkerProps = {
  lat: number;
  lng: number;
  price: number;
  bhk?: number | null;
  locality?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onBlur?: () => void;
};

export function PriceMarker({
  lat,
  lng,
  price,
  bhk,
  locality,
  isVerified,
  isActive,
  onClick,
  onHover,
  onBlur,
}: PriceMarkerProps) {
  return (
    <OverlayViewF
      position={{ lat, lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({ x: -width / 2, y: -height })}
    >
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onBlur}
        className={cn(
          "price-pin group flex items-center gap-1.5",
          isActive && "is-active",
          isVerified && "is-verified"
        )}
        aria-label={`${formatRentCompact(price)} ${bhk ? `${bhk}BHK` : ""} in ${locality ?? ""}`}
      >
        <span className="price-pin__amount">{formatRentCompact(price)}</span>
        {bhk ? <span className="price-pin__bhk">{bhk} BHK</span> : null}
        {locality ? (
          <span className="price-pin__locality">{locality}</span>
        ) : null}
      </button>
    </OverlayViewF>
  );
}

type ClusterMarkerProps = {
  lat: number;
  lng: number;
  count: number;
  onClick?: () => void;
};

export function ClusterMarker({ lat, lng, count, onClick }: ClusterMarkerProps) {
  return (
    <OverlayViewF
      position={{ lat, lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({ x: -width / 2, y: -height / 2 })}
    >
      <button type="button" onClick={onClick} className="price-pin is-cluster">
        {count} flats
      </button>
    </OverlayViewF>
  );
}
