"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Crosshair } from "lucide-react";
import { Button } from "../ui/Button";

const KOLKATA_CENTER = { lat: 22.5726, lng: 88.3639 };

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f3" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5c5c66" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe5f0" }] },
];

type MiniMapPickerProps = {
  value: { lat: number; lng: number } | null;
  onChange: (next: { lat: number; lng: number; locality?: string }) => void;
  height?: number;
  pinColor?: string;
  helperText?: string;
};

export function MiniMapPicker({
  value,
  onChange,
  height = 240,
  pinColor = "#ff385c",
  helperText,
}: MiniMapPickerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || !value) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map: mapRef.current,
        position: value,
        icon: {
          path: "M12 2c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12Z",
          fillColor: pinColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 1.8,
          anchor: new google.maps.Point(12, 22),
        },
        draggable: true,
      });
      markerRef.current.addListener("dragend", () => {
        const pos = markerRef.current?.getPosition();
        if (pos) {
          onChange({ lat: pos.lat(), lng: pos.lng() });
          reverseGeocode(pos.lat(), pos.lng()).then((label) => setResolvedLabel(label));
        }
      });
    } else {
      markerRef.current.setPosition(value);
    }
    reverseGeocode(value.lat, value.lng).then((label) => setResolvedLabel(label));
  }, [value, pinColor, onChange]);

  const onMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    onChange({ lat, lng });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      onChange({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(15);
    });
  };

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-ink-200 bg-ink-50 p-4 text-xs text-ink-500" style={{ height }}>
        Maps key missing. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-ink-100" style={{ height }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={value ?? KOLKATA_CENTER}
            zoom={value ? 15 : 12}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onClick={onMapClick}
            options={{
              styles: MAP_STYLES,
              disableDefaultUI: true,
              zoomControl: true,
              clickableIcons: false,
              gestureHandling: "greedy",
              draggableCursor: "crosshair",
            }}
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-ink-500">Loading map…</div>
        )}
        <button
          type="button"
          onClick={useMyLocation}
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-medium text-ink-700 shadow-sm hover:shadow-card"
        >
          <Crosshair className="h-3.5 w-3.5" /> Use my location
        </button>
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-500">
        <span>{helperText ?? "Tap on the map or drag the pin to set the exact location."}</span>
        {value && (
          <span className="font-mono text-ink-700">
            {resolvedLabel ?? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`}
          </span>
        )}
      </div>
    </div>
  );
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ location: { lat, lng } });
    const candidate =
      result.results.find((r) => r.types.includes("sublocality"))?.formatted_address ??
      result.results.find((r) => r.types.includes("neighborhood"))?.formatted_address ??
      result.results[0]?.formatted_address;
    if (!candidate) return null;
    return candidate.split(",").slice(0, 2).join(", ");
  } catch {
    return null;
  }
}
