"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  // Skip the very first auto-refresh: SSR already provided initialListings, and the
  // map fires onIdle automatically once it loads. Without this guard, the first
  // automatic onIdle would refetch with the (tighter) visible bounds at zoom 11.5
  // and drop edge-of-city listings, replacing the SSR result with a smaller set.
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

  // Always use the live result length. Never fall back to SSR count when length is 0 —
  // `0 || initialTotal` wrongly showed "133+" after a search returned no rows.
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
      // Pad the visible bounds so listings at the edge of the viewport (and the
      // SSR-provided default Kolkata window) don't disappear when the client
      // refetches at the current zoom level.
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
    // SSR already populated `initialListings`; don't clobber it with a redundant
    // fetch on the very first render. Subsequent filter changes do refetch.
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    refresh();
  }, [refresh]);

  const onMapIdle = () => {
    if (areaPickActive) return;
    if (!boundsSearch) return;
    // The first onIdle fires automatically right after the map loads; the user
    // hasn't actually moved the map yet, so don't refetch (it would just shrink
    // the SSR result to the tighter visible window).
    if (!userInteractedRef.current) return;
    refresh();
  };

  const onMapInteract = () => {
    userInteractedRef.current = true;
  };

  const visibleListings = useMemo(() => listings, [listings]);

  if (!mapApiKey) {
    return (
      <div className="grid h-[80vh] place-items-center text-sm text-ink-500">
        Set{" "}
        <code className="mx-1 rounded bg-ink-100 px-2 py-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
        {" "}or{" "}
        <code className="mx-1 rounded bg-ink-100 px-2 py-1">GOOGLE_MAPS_API_KEY</code>
        {" "}to load the map.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FilterBar filters={filters} onChange={setFilters} totalCount={total} />

      <div
        className={cn(
          "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]",
          mapFullscreen && "lg:grid-cols-1"
        )}
      >
        <div className={cn("space-y-3", mapFullscreen && "hidden")}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-600">
              {total === 0 ? (
                <>
                  <span className="font-semibold text-ink-900">No homes</span> in this view
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink-900">{total}+ homes</span> in this view
                </>
              )}
            </p>
            <p className="text-xs text-ink-500">
              {isLoading ? "Updating…" : "Showing live and aggregated listings"}
            </p>
          </div>
          {visibleListings.length === 0 ? (
            <EmptyState
              title={
                filters.query.trim()
                  ? `No matches for “${filters.query.trim()}”`
                  : "No homes match your filters"
              }
              description={
                filters.query.trim()
                  ? "The database search can be strict. Try shorter words (e.g. “Salt Lake”, “Sector”), clear the search box, or reset filters."
                  : "Try widening the rent range, removing BHK or sharing filters, or panning the map."
              }
              action={<Button onClick={() => setFilters(defaultFilters)}>Reset filters</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isHighlighted={hovered === listing.id || selected?.id === listing.id}
                  onHover={() => setHovered(listing.id)}
                  onBlur={() => setHovered((curr) => (curr === listing.id ? null : curr))}
                  isShortlisted={shortlist.has(listing.id)}
                  onShortlist={() => void toggleShortlist(listing.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className={cn(
            "sticky top-24 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card",
            mapFullscreen
              ? "fixed inset-0 z-[100] block h-[100dvh] min-h-0 w-full rounded-none border-0 shadow-none lg:block"
              : "hidden h-[calc(100vh-160px)] min-h-[600px] lg:block"
          )}
        >
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
              {visibleListings.map((listing) => (
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

              <div className="pointer-events-none absolute right-3 top-3 z-[1] flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => setMapFullscreen((v) => !v)}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm hover:bg-white"
                  aria-label={mapFullscreen ? "Exit fullscreen map" : "Expand map to fullscreen"}
                >
                  {mapFullscreen ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5" /> Exit fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5" /> Fullscreen map
                    </>
                  )}
                </button>
              </div>

              <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
                <span className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-ink-700 shadow-sm">
                  Search as I move
                  <button
                    onClick={() => setBoundsSearch((v) => !v)}
                    className={cn(
                      "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
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
                  onClick={() => setShowMetro((v) => !v)}
                  className={cn(
                    "pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm",
                    showMetro ? "bg-ink-900 text-white" : "bg-white/95 text-ink-700"
                  )}
                >
                  <Train className="h-3.5 w-3.5" /> Metro
                </button>
                <button
                  onClick={() => setShowSeekers((v) => !v)}
                  className={cn(
                    "pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm",
                    showSeekers ? "bg-purple-600 text-white" : "bg-white/95 text-ink-700"
                  )}
                >
                  <MapPinned className="h-3.5 w-3.5" /> Seeker pins
                </button>
                <button
                  onClick={() => setAreaPickActive((v) => !v)}
                  className={cn(
                    "pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm",
                    areaPickActive ? "bg-brand text-white" : "bg-white/95 text-ink-700"
                  )}
                >
                  <Layers className="h-3.5 w-3.5" /> Pick area
                </button>
              </div>

              {showMetro && (
                <div className="pointer-events-none absolute bottom-4 right-4 max-w-[180px]">
                  <MetroLegend />
                </div>
              )}

              {!boundsSearch && !areaPickActive && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
                  <Button className="pointer-events-auto" variant="primary" onClick={() => refresh()}>
                    Search this area
                  </Button>
                </div>
              )}
            </GoogleMap>
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink-500">Loading map…</div>
          )}
        </div>
      </div>
    </div>
  );
}
