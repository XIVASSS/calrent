"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, InfoWindowF } from "@react-google-maps/api";
import { Layers, MapPinned, Maximize2, Minimize2, Train } from "lucide-react";
import { ListingCard } from "./ListingCard";
import { PriceMarker } from "./PriceMarker";
import { FilterBar } from "./FilterBar";
import { useDiscoveryHome } from "./DiscoveryHomeContext";
import { defaultFilters } from "./discoveryFilters";
import type { PublicListing } from "../../lib/supabase/types";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { ListingPopupCard } from "./ListingPopupCard";
import { MetroOverlay, MetroLegend } from "./MetroOverlay";
import { AreaStatsTool } from "./AreaStatsTool";
import { SeekerPinLayer } from "./SeekerPinLayer";
import { cn } from "../../lib/utils";

const KOLKATA_CENTER = { lat: 22.5726, lng: 88.3639 };

/** Pull each mobile listing card over the previous one; spacer below restores scroll extent (negative margins shrink scroll height otherwise). */
const MOBILE_CARD_STACK_OVERLAP_REM = 6.5;

const MAP_LIGHT_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f3" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5c5c66" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e8efe2" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fdfdfd" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f1d77b" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe5f0" }] },
];

type DiscoveryShellProps = {
  initialListings: PublicListing[];
  initialShortlist?: string[];
  isAuthenticated?: boolean;
  mapApiKey?: string;
};

export function DiscoveryShell({
  initialListings,
  initialShortlist = [],
  isAuthenticated = false,
  mapApiKey = "",
}: DiscoveryShellProps) {
  const { filters, setFilters, setListingCount, setHomeDiscoveryActive, setFiltersPanelOpen } =
    useDiscoveryHome();
  const [listings, setListings] = useState<PublicListing[]>(initialListings);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicListing | null>(null);
  const [boundsSearch, setBoundsSearch] = useState(true);
  const [shortlist, setShortlist] = useState<Set<string>>(new Set(initialShortlist));
  const [showMetro, setShowMetro] = useState(true);
  const [showSeekers, setShowSeekers] = useState(true);
  const [areaPickActive, setAreaPickActive] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const fetchSeq = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const initialMountRef = useRef(true);
  const userInteractedRef = useRef(false);

  const toggleShortlist = async (listingId: string) => {
    if (!isAuthenticated) {
      window.location.href = `/auth/sign-in?redirect=/`;
      return;
    }
    const isShortlisted = shortlist.has(listingId);
    setShortlist((prev) => {
      const next = new Set(prev);
      if (isShortlisted) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
    await fetch("/api/shortlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action: isShortlisted ? "remove" : "add" }),
    });
  };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: mapApiKey,
  });

  const total = listings.length;

  useLayoutEffect(() => {
    setListingCount(total);
  }, [total, setListingCount]);

  useEffect(() => {
    setHomeDiscoveryActive(true);
    return () => {
      setHomeDiscoveryActive(false);
      setFilters(defaultFilters);
      setFiltersPanelOpen(false);
      setListingCount(0);
    };
  }, [setHomeDiscoveryActive, setFilters, setFiltersPanelOpen, setListingCount]);

  useEffect(() => {
    if (!mapFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mapFullscreen]);

  useEffect(() => {
    if (!mapFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMapFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapFullscreen]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || typeof window === "undefined" || !window.google?.maps?.event)
      return;
    const map = mapRef.current;
    const t = window.setTimeout(() => window.google.maps.event.trigger(map, "resize"), 120);
    return () => window.clearTimeout(t);
  }, [mapFullscreen, mapReady]);

  const refresh = useCallback(
    async (overrideBounds?: google.maps.LatLngBounds | null) => {
      const map = mapRef.current;
      const bounds = overrideBounds ?? map?.getBounds() ?? null;
      const sw = bounds?.getSouthWest();
      const ne = bounds?.getNorthEast();
      const rawMinLat = sw?.lat();
      const rawMinLng = sw?.lng();
      const rawMaxLat = ne?.lat();
      const rawMaxLng = ne?.lng();
      const hasBounds =
        typeof rawMinLat === "number" &&
        typeof rawMinLng === "number" &&
        typeof rawMaxLat === "number" &&
        typeof rawMaxLng === "number";
      const latSpan = hasBounds ? rawMaxLat! - rawMinLat! : 0;
      const lngSpan = hasBounds ? rawMaxLng! - rawMinLng! : 0;
      const latPad = latSpan * 0.25;
      const lngPad = lngSpan * 0.25;
      const minLat = hasBounds ? Math.min(rawMinLat! - latPad, 22.42) : 22.42;
      const minLng = hasBounds ? Math.min(rawMinLng! - lngPad, 88.25) : 88.25;
      const maxLat = hasBounds ? Math.max(rawMaxLat! + latPad, 22.7) : 22.7;
      const maxLng = hasBounds ? Math.max(rawMaxLng! + lngPad, 88.55) : 88.55;
      const seq = ++fetchSeq.current;
      setIsLoading(true);
      try {
        const res = await fetch("/api/listings/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            minLat,
            minLng,
            maxLat,
            maxLng,
            minRent: filters.minRent,
            maxRent: filters.maxRent,
            bhk: filters.bhk.length ? filters.bhk : null,
            sharing: filters.sharing.length ? filters.sharing : null,
            furnishing: filters.furnishing.length ? filters.furnishing : null,
            gender: filters.gender,
            noBroker: filters.noBroker,
            query: filters.query?.trim() || null,
            limit: 500,
          }),
        });
        if (!res.ok) throw new Error("search_failed");
        const json = (await res.json()) as { listings: PublicListing[] };
        if (fetchSeq.current === seq) {
          setListings(json.listings ?? []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (fetchSeq.current === seq) setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    refresh();
  }, [refresh]);

  const onMapIdle = () => {
    if (areaPickActive) return;
    if (!boundsSearch) return;
    if (!userInteractedRef.current) return;
    refresh();
  };

  const onMapInteract = () => {
    userInteractedRef.current = true;
  };

  if (!mapApiKey) {
    return (
      <div className="grid min-h-[50vh] place-items-center px-4 text-center text-sm text-ink-500">
        <p>
          Set{" "}
          <code className="rounded bg-ink-100 px-2 py-1 text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
          {" "}or{" "}
          <code className="rounded bg-ink-100 px-2 py-1 text-xs">GOOGLE_MAPS_API_KEY</code>
          {" "}to load the map.
        </p>
      </div>
    );
  }

  const mapShellClass = cn(
    "relative w-full shrink-0 overflow-hidden bg-white shadow-card",
    mapFullscreen
      ? "fixed inset-0 z-[100] h-[100dvh] rounded-none border-0 shadow-none"
      : [
          "rounded-2xl border border-ink-100",
          // Mobile: fixed-height band; listings scroll in sibling pane (no overlap behind map)
          "h-[min(40vh,400px)] min-h-[232px] max-h-[440px]",
          // Desktop: sticky map column
          "lg:sticky lg:top-24 lg:z-auto lg:h-[calc(100vh-160px)] lg:min-h-[560px] lg:max-h-none lg:rounded-3xl",
        ]
  );

  const mapInner = (
    <>
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={KOLKATA_CENTER}
          zoom={11.5}
          onLoad={(map) => {
            mapRef.current = map;
            setMapReady(true);
          }}
          onClick={() => {
            if (!areaPickActive) setSelected(null);
          }}
          onIdle={onMapIdle}
          onDragStart={onMapInteract}
          onZoomChanged={onMapInteract}
          options={{
            styles: MAP_LIGHT_STYLES,
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
            gestureHandling: "greedy",
            backgroundColor: "#fafaf7",
          }}
        >
          {listings.map((listing) => (
            <PriceMarker
              key={listing.id}
              lat={listing.lat}
              lng={listing.lng}
              price={listing.rent}
              bhk={listing.bhk}
              locality={listing.locality}
              isVerified={listing.is_verified}
              isActive={hovered === listing.id || selected?.id === listing.id}
              onClick={() => setSelected(listing)}
              onHover={() => setHovered(listing.id)}
              onBlur={() => setHovered((curr) => (curr === listing.id ? null : curr))}
            />
          ))}

          {selected && (
            <InfoWindowF
              position={{ lat: selected.lat, lng: selected.lng }}
              options={{ pixelOffset: new google.maps.Size(0, -16) }}
              onCloseClick={() => setSelected(null)}
            >
              <ListingPopupCard listing={selected} />
            </InfoWindowF>
          )}

          <MetroOverlay map={mapReady ? mapRef.current : null} visible={showMetro} />
          <SeekerPinLayer map={mapReady ? mapRef.current : null} visible={showSeekers} />
          <AreaStatsTool
            map={mapReady ? mapRef.current : null}
            active={areaPickActive}
            onCancel={() => setAreaPickActive(false)}
          />

          <div className="pointer-events-none absolute right-2 top-2 z-[1] flex flex-col items-end gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
            <button
              type="button"
              onClick={() => setMapFullscreen((v) => !v)}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
              aria-label={mapFullscreen ? "Exit fullscreen map" : "Expand map to fullscreen"}
            >
              {mapFullscreen ? (
                <>
                  <Minimize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Exit
                </>
              ) : (
                <>
                  <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Fullscreen
                </>
              )}
            </button>
          </div>

          <div className="pointer-events-none absolute left-2 top-2 flex max-w-[55%] flex-col gap-1.5 sm:left-3 sm:top-3 sm:gap-2 lg:max-w-none">
            <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-sm sm:px-3 sm:py-1.5 sm:text-xs">
              Move search
              <button
                type="button"
                onClick={() => setBoundsSearch((v) => !v)}
                className={cn(
                  "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
                  boundsSearch ? "bg-ink-900" : "bg-ink-300"
                )}
                aria-pressed={boundsSearch}
              >
                <span
                  className={cn(
                    "absolute h-3 w-3 rounded-full bg-white transition-transform",
                    boundsSearch ? "translate-x-3.5" : "translate-x-0.5"
                  )}
                />
              </button>
            </span>
            <button
              type="button"
              onClick={() => setShowMetro((v) => !v)}
              className={cn(
                "pointer-events-auto inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs",
                showMetro ? "bg-ink-900 text-white" : "bg-white/95 text-ink-700"
              )}
            >
              <Train className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" /> Metro
            </button>
            <button
              type="button"
              onClick={() => setShowSeekers((v) => !v)}
              className={cn(
                "pointer-events-auto inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs",
                showSeekers ? "bg-purple-600 text-white" : "bg-white/95 text-ink-700"
              )}
            >
              <MapPinned className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" /> Seekers
            </button>
            <button
              type="button"
              onClick={() => setAreaPickActive((v) => !v)}
              className={cn(
                "pointer-events-auto inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs",
                areaPickActive ? "bg-brand text-white" : "bg-white/95 text-ink-700"
              )}
            >
              <Layers className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" /> Area
            </button>
          </div>

          {showMetro && (
            <div className="pointer-events-none absolute bottom-3 right-2 max-w-[160px] sm:bottom-4 sm:right-4 sm:max-w-[180px]">
              <MetroLegend />
            </div>
          )}

          {!boundsSearch && !areaPickActive && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 max-w-[calc(100%-1rem)] -translate-x-1/2 sm:bottom-4">
              <Button className="pointer-events-auto text-xs sm:text-sm" variant="primary" onClick={() => refresh()}>
                Search this area
              </Button>
            </div>
          )}
        </GoogleMap>
      ) : (
        <div className="grid h-full min-h-[200px] place-items-center text-sm text-ink-500">Loading map…</div>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-3 max-lg:h-full max-lg:min-h-0 max-lg:flex-[1_1_0%] max-lg:overflow-hidden">
      <FilterBar filters={filters} onChange={setFilters} totalCount={total} />

      <div
        className={cn(
          "min-h-0 gap-3",
          mapFullscreen
            ? "flex flex-col max-lg:flex-none max-lg:overflow-visible lg:block"
            : [
                // Mobile: grid row 1 = map (auto), row 2 = listings (minmax(0,1fr)) — reliable scrollport on WebKit
                "grid max-lg:flex-1 max-lg:min-h-0 max-lg:grid-cols-1 max-lg:grid-rows-[auto_minmax(0,1fr)] max-lg:overflow-hidden",
                "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:grid-rows-1 lg:items-start lg:overflow-visible lg:h-auto",
                "lg:gap-4",
              ]
        )}
      >
        <section
          className={cn(
            "flex min-h-0 flex-col gap-3 lg:min-h-0",
            mapFullscreen && "hidden",
            // Mobile: second grid row fills remaining height; DOM stays section-then-aside, so pin to row 2
            "max-lg:row-start-2 max-lg:h-full max-lg:min-h-0 max-lg:overflow-y-auto max-lg:overscroll-y-auto max-lg:border-t max-lg:border-ink-100 max-lg:bg-white max-lg:pt-3 max-lg:rounded-b-2xl",
            "pb-2 lg:pb-0 max-lg:pb-28",
            "touch-pan-y"
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-label="Listings"
        >
          <div className="flex items-center justify-between gap-2 px-0.5">
            <p className="text-sm text-ink-600">
              {total === 0 ? (
                <>
                  <span className="font-semibold text-ink-900">No homes</span> in this view
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink-900">{total}+ homes</span>{" "}
                  <span className="hidden sm:inline">in this view</span>
                </>
              )}
            </p>
            <p className="text-xs text-ink-500 whitespace-nowrap">
              {isLoading ? "Updating…" : "Live listings"}
            </p>
          </div>

          {listings.length === 0 ? (
            <EmptyState
              title={
                filters.query.trim()
                  ? `No matches for “${filters.query.trim()}”`
                  : "No homes match your filters"
              }
              description={
                filters.query.trim()
                  ? "Try shorter words (e.g. “Salt Lake”, “Sector”), clear the search, or reset filters."
                  : "Try widening rent range, removing filters, or moving the map."
              }
              action={<Button onClick={() => setFilters(defaultFilters)}>Reset filters</Button>}
            />
          ) : (
            <>
              <div className="max-lg:flex max-lg:flex-col max-lg:gap-0 lg:grid lg:grid-cols-1 lg:gap-4 xl:grid-cols-2">
                {listings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className={cn(
                      "lg:contents",
                      // Mobile: sticky deck — each card sticks until the next slides over it (ListingCard uses article + router, not full-card Link)
                      "max-lg:sticky max-lg:top-2 max-lg:scroll-mt-2 max-lg:rounded-3xl max-lg:border max-lg:border-ink-100/90 max-lg:bg-white max-lg:p-2 max-lg:px-1.5 max-lg:pb-1 max-lg:shadow-floating max-lg:ring-1 max-lg:ring-ink-100/80 max-lg:[transform:translateZ(0)]"
                    )}
                    style={{
                      zIndex: index + 1,
                      ...(index > 0
                        ? { marginTop: `${-MOBILE_CARD_STACK_OVERLAP_REM}rem` }
                        : undefined),
                    }}
                  >
                    <ListingCard
                      listing={listing}
                      isHighlighted={hovered === listing.id || selected?.id === listing.id}
                      onHover={() => setHovered(listing.id)}
                      onBlur={() => setHovered((curr) => (curr === listing.id ? null : curr))}
                      isShortlisted={shortlist.has(listing.id)}
                      onShortlist={() => void toggleShortlist(listing.id)}
                    />
                  </div>
                ))}
              </div>
              {/* Negative margins shorten scroll range; this restores full touch-scroll distance */}
              {listings.length > 1 ? (
                <div
                  aria-hidden
                  className="pointer-events-none shrink-0 max-lg:block lg:hidden"
                  style={{
                    height: `${(listings.length - 1) * MOBILE_CARD_STACK_OVERLAP_REM}rem`,
                  }}
                />
              ) : null}
            </>
          )}
        </section>

        <aside
          className={cn(
            "flex-none max-lg:row-start-1 lg:col-start-2",
            mapShellClass
          )}
          aria-label="Map"
        >
          {mapInner}
        </aside>
      </div>
    </div>
  );
}
