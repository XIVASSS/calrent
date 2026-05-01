"use client";

import { useEffect, useRef } from "react";
import { METRO_LINES, type MetroLine } from "../../lib/metro/stations";

type MetroOverlayProps = {
  map: google.maps.Map | null;
  visible: boolean;
};

export function MetroOverlay({ map, visible }: MetroOverlayProps) {
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const stationsRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!map) return;
    polylinesRef.current.forEach((p) => p.setMap(null));
    stationsRef.current.forEach((s) => s.setMap(null));
    polylinesRef.current = [];
    stationsRef.current = [];

    if (!visible) return;

    METRO_LINES.forEach((line: MetroLine) => {
      const path = line.stations.map((s) => ({ lat: s.lat, lng: s.lng }));
      const polyline = new google.maps.Polyline({
        path,
        geodesic: false,
        strokeColor: line.color,
        strokeOpacity: 0.85,
        strokeWeight: 4,
        zIndex: 1,
      });
      polyline.setMap(map);
      polylinesRef.current.push(polyline);

      line.stations.forEach((station) => {
        const marker = new google.maps.Marker({
          position: { lat: station.lat, lng: station.lng },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 4.5,
            fillColor: "#ffffff",
            fillOpacity: 1,
            strokeColor: line.color,
            strokeWeight: 2.5,
          },
          title: `${station.name}${station.alsoKnownAs ? ` (${station.alsoKnownAs})` : ""} · ${line.name}`,
          zIndex: 2,
          clickable: false,
        });
        marker.setMap(map);
        stationsRef.current.push(marker);
      });
    });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      stationsRef.current.forEach((s) => s.setMap(null));
      polylinesRef.current = [];
      stationsRef.current = [];
    };
  }, [map, visible]);

  return null;
}

export function MetroLegend() {
  return (
    <div className="pointer-events-auto rounded-2xl border border-ink-100 bg-white/95 px-3 py-2 text-[11px] shadow-card backdrop-blur-md">
      <p className="mb-1 font-semibold text-ink-700">Kolkata Metro</p>
      <div className="flex flex-col gap-1">
        {METRO_LINES.map((line) => (
          <div key={line.id} className="flex items-center gap-2 text-ink-600">
            <span className="inline-block h-2 w-6 rounded-full" style={{ background: line.color }} />
            <span className="font-medium">{line.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
