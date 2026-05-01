"use client";

import { useEffect, useRef, useState } from "react";
import { InfoWindowF } from "@react-google-maps/api";
import { formatRentCompact } from "../../lib/utils";

type SeekerPin = {
  id: string;
  looking_for: "flat" | "room" | "flatmate" | "pg" | "any";
  budget: number;
  bhk_pref: number | null;
  move_in: string | null;
  self_gender: string | null;
  flatmate_gender_pref: string | null;
  parking_required: boolean | null;
  lifestyle_text: string | null;
  lat: number;
  lng: number;
  created_at: string;
};

type SeekerPinLayerProps = {
  map: google.maps.Map | null;
  visible: boolean;
};

const LOOKING_LABEL: Record<string, string> = {
  flat: "Flat",
  room: "Room",
  flatmate: "Flatmate",
  pg: "PG",
  any: "Anything",
};

export function SeekerPinLayer({ map, visible }: SeekerPinLayerProps) {
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [pins, setPins] = useState<SeekerPin[]>([]);
  const [selected, setSelected] = useState<SeekerPin | null>(null);

  useEffect(() => {
    if (!visible) {
      setPins([]);
      setSelected(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const params = new URLSearchParams({
          minLat: "22.42",
          minLng: "88.25",
          maxLat: "22.7",
          maxLng: "88.55",
        });
        const res = await fetch(`/api/seeker-pins?${params}`);
        const json = (await res.json()) as { pins: SeekerPin[] };
        if (!cancelled) setPins(json.pins ?? []);
      } catch (err) {
        console.error(err);
      }
    };
    void load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [visible]);

  useEffect(() => {
    if (!map) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (!visible) return;
    pins.forEach((pin) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: pin.lat, lng: pin.lng },
        icon: {
          path: "M12 2c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12Z",
          fillColor: "#7c3aed",
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 1.3,
          anchor: new google.maps.Point(12, 22),
        },
        zIndex: 5,
        title: `Seeker · ${LOOKING_LABEL[pin.looking_for] ?? pin.looking_for} · ${formatRentCompact(pin.budget)}`,
      });
      marker.addListener("click", () => setSelected(pin));
      markersRef.current.push(marker);
    });
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [map, pins, visible]);

  if (!visible || !selected) return null;

  return (
    <InfoWindowF
      position={{ lat: selected.lat, lng: selected.lng }}
      options={{ pixelOffset: new google.maps.Size(0, -16) }}
      onCloseClick={() => setSelected(null)}
    >
      <div className="min-w-[220px] space-y-1.5 px-1 py-1">
        <p className="text-[15px] font-semibold text-ink-900">
          Looking for {LOOKING_LABEL[selected.looking_for] ?? selected.looking_for}
        </p>
        <p className="text-sm text-ink-700">
          Budget · <span className="font-semibold">{formatRentCompact(selected.budget)}</span>/mo
          {selected.bhk_pref ? ` · ${selected.bhk_pref} BHK` : ""}
        </p>
        {selected.move_in && (
          <p className="text-xs text-ink-500">Move-in: {selected.move_in.replaceAll("_", " ")}</p>
        )}
        {selected.lifestyle_text && (
          <p className="line-clamp-3 text-xs text-ink-600">{selected.lifestyle_text}</p>
        )}
        <p className="text-[11px] text-ink-400">
          Contact details revealed only when you accept a match.
        </p>
      </div>
    </InfoWindowF>
  );
}
