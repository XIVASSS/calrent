import { KOLKATA_METRO_STATIONS, MetroStation } from "./metro-stations";

const EARTH_RADIUS = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function getNearestMetro(coord: { lat: number; lng: number }) {
  return KOLKATA_METRO_STATIONS.map((station) => ({
    station,
    distanceMeters: haversineMeters(coord, station),
  })).sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
}

export function getKScore(coord: { lat: number; lng: number }) {
  const nearest = getNearestMetro(coord);
  // 0 m -> 100, 4 km -> 0
  const score = 100 - (nearest.distanceMeters / 4000) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function describeStation(station: MetroStation) {
  return `${station.name} (${station.line} line)`;
}
