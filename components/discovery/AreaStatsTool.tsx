"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, X } from "lucide-react";
import { cn, formatINR } from "../../lib/utils";

type StatsRow = {
  bhk_label: string;
  flat_count: number;
  avg_rent: number;
  min_rent: number;
  max_rent: number;
};

export type AreaSelection = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

type AreaStatsToolProps = {
  map: google.maps.Map | null;
  active: boolean;
  onCancel: () => void;
};

type Mode = "idle" | "selecting" | "loaded";

export function AreaStatsTool({ map, active, onCancel }: AreaStatsToolProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [selection, setSelection] = useState<AreaSelection | null>(null);
  const [stats, setStats] = useState<StatsRow[] | null>(null);
  const [filter, setFilter] = useState<"all" | "gated" | "ungated">("all");
  const [loading, setLoading] = useState(false);

  const startPointRef = useRef<google.maps.LatLng | null>(null);
  const rectRef = useRef<google.maps.Rectangle | null>(null);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  useEffect(() => {
    if (!map) return;
    if (!active) {
      cleanupDrawing();
      setMode("idle");
      setSelection(null);
      setStats(null);
      return;
    }
    setMode("selecting");
    map.setOptions({ draggableCursor: "crosshair", gestureHandling: "cooperative" });

    const onMouseDown = (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      cleanupRect();
      startPointRef.current = event.latLng;
      const newRect = new google.maps.Rectangle({
        map,
        bounds: new google.maps.LatLngBounds(event.latLng, event.latLng),
        strokeColor: "#ff385c",
        strokeWeight: 2,
        fillColor: "#ff385c",
        fillOpacity: 0.12,
        clickable: false,
      });
      rectRef.current = newRect;
      map.setOptions({ draggable: false });
    };

    const onMouseMove = (event: google.maps.MapMouseEvent) => {
      if (!startPointRef.current || !rectRef.current || !event.latLng) return;
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(startPointRef.current);
      bounds.extend(event.latLng);
      rectRef.current.setBounds(bounds);
    };

    const onMouseUp = () => {
      if (!startPointRef.current || !rectRef.current) return;
      const b = rectRef.current.getBounds();
      const sw = b?.getSouthWest();
      const ne = b?.getNorthEast();
      map.setOptions({ draggable: true });
      startPointRef.current = null;
      if (sw && ne) {
        const sel: AreaSelection = {
          minLat: sw.lat(),
          minLng: sw.lng(),
          maxLat: ne.lat(),
          maxLng: ne.lng(),
        };
        if (
          Math.abs(sel.maxLat - sel.minLat) < 0.001 ||
          Math.abs(sel.maxLng - sel.minLng) < 0.001
        ) {
          cleanupRect();
          return;
        }
        setSelection(sel);
        setMode("loaded");
        loadStats(sel, filter);
      }
    };

    listenersRef.current.push(map.addListener("mousedown", onMouseDown));
    listenersRef.current.push(map.addListener("mousemove", onMouseMove));
    listenersRef.current.push(map.addListener("mouseup", onMouseUp));

    return cleanupDrawing;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, active]);

  useEffect(() => {
    if (selection) loadStats(selection, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  function cleanupRect() {
    if (rectRef.current) {
      rectRef.current.setMap(null);
      rectRef.current = null;
    }
  }

  function cleanupDrawing() {
    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];
    cleanupRect();
    if (map) {
      map.setOptions({ draggableCursor: undefined, draggable: true, gestureHandling: "greedy" });
    }
  }

  async function loadStats(sel: AreaSelection, f: "all" | "gated" | "ungated") {
    setLoading(true);
    try {
      const res = await fetch("/api/area-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sel,
          onlyGated: f === "gated" ? true : f === "ungated" ? false : null,
        }),
      });
      const json = (await res.json()) as { stats: StatsRow[] };
      setStats(json.stats ?? []);
    } catch (err) {
      console.error(err);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }

  function close() {
    cleanupDrawing();
    setMode("idle");
    setSelection(null);
    setStats(null);
    onCancel();
  }

  if (!active) return null;

  if (mode === "selecting") {
    return (
      <div className="pointer-events-auto absolute inset-x-3 top-3 mx-auto max-w-sm rounded-2xl border border-ink-100 bg-white/95 p-3 shadow-card backdrop-blur-md">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-ink-900">📐 Pick area for stats</p>
          <button onClick={close} className="grid h-7 w-7 place-items-center rounded-full hover:bg-ink-100" aria-label="Cancel">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          Click and drag on the map to draw a box around the area you want stats for.
        </p>
      </div>
    );
  }

  const total = stats?.reduce((acc, row) => acc + row.flat_count, 0) ?? 0;
  const overallAvg =
    total > 0 && stats
      ? Math.round(
          stats.reduce((acc, row) => acc + row.avg_rent * row.flat_count, 0) / total
        )
      : 0;

  return (
    <div className="pointer-events-auto absolute right-3 top-3 w-80 max-w-[90vw] rounded-2xl border border-ink-100 bg-white shadow-floating">
      <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <div>
          <p className="text-[15px] font-semibold text-ink-900">Stats for Area</p>
          <p className="text-xs text-ink-500">
            {loading ? "Crunching…" : `${total} pins found in selection`}
          </p>
        </div>
        <button onClick={close} className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink-100" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="px-4 py-3">
        <div className="flex gap-2 text-[11px]">
          {(
            [
              { id: "all", label: "All" },
              { id: "gated", label: "🏘 Gated" },
              { id: "ungated", label: "🚪 Not Gated" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex-1 rounded-full border px-2 py-1.5 font-medium transition",
                filter === f.id
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-400"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {total > 0 && (
          <div className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-sm">
            <p className="text-[11px] uppercase tracking-wide text-ink-500">
              Overall avg · {total} flats
            </p>
            <p className="text-xl font-semibold text-ink-900">{formatINR(overallAvg)}</p>
          </div>
        )}
        <div className="mt-3 space-y-2">
          {(stats ?? []).map((row) => (
            <div
              key={row.bhk_label}
              className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold text-ink-900">{row.bhk_label}</p>
                <p className="text-[11px] text-ink-500">{row.flat_count} flats</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink-900">{formatINR(row.avg_rent)}</p>
                <p className="text-[11px] text-ink-500">
                  {formatINR(row.min_rent)} – {formatINR(row.max_rent)}
                </p>
              </div>
            </div>
          ))}
          {stats && stats.length === 0 && !loading && (
            <p className="rounded-xl border border-dashed border-ink-200 px-3 py-4 text-center text-xs text-ink-500">
              No live listings in this area yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
