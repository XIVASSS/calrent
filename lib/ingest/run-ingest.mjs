// Standalone CLI ingestion runner.
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node lib/ingest/run-ingest.mjs lib/ingest/sample-sources.json
//
// If SUPABASE_SERVICE_ROLE_KEY is not provided, the script logs unified records
// to stdout without writing to the DB.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const inputArg = args[0] ?? "lib/ingest/sample-sources.json";
const inputPath = path.resolve(inputArg);

const KOLKATA_LANDMARKS = {
  "south city": { lat: 22.5012, lng: 88.3617 },
  "salt lake": { lat: 22.5798, lng: 88.4304 },
  "salt lake sector v": { lat: 22.5798, lng: 88.4304 },
  "new town": { lat: 22.5755, lng: 88.4794 },
  garia: { lat: 22.4628, lng: 88.3911 },
  "park street": { lat: 22.5531, lng: 88.3526 },
  ruby: { lat: 22.5173, lng: 88.4005 },
  tollygunge: { lat: 22.5152, lng: 88.3676 },
  "new alipore": { lat: 22.5109, lng: 88.3326 },
  alipore: { lat: 22.534, lng: 88.3296 },
  behala: { lat: 22.4945, lng: 88.3137 },
  sealdah: { lat: 22.5682, lng: 88.3701 },
  "howrah maidan": { lat: 22.5925, lng: 88.3117 },
  ballygunge: { lat: 22.5298, lng: 88.3647 },
  "lake gardens": { lat: 22.502, lng: 88.3625 },
  jadavpur: { lat: 22.4988, lng: 88.371 },
  dumdum: { lat: 22.6208, lng: 88.4208 },
};

const METRO = [
  { name: "Kavi Subhash", lat: 22.4812, lng: 88.3924 },
  { name: "Rabindra Sadan", lat: 22.5448, lng: 88.3458 },
  { name: "Esplanade", lat: 22.5658, lng: 88.3527 },
  { name: "Dumdum", lat: 22.6208, lng: 88.4208 },
  { name: "Salt Lake Sector V", lat: 22.5798, lng: 88.4304 },
  { name: "Howrah Maidan", lat: 22.5925, lng: 88.3117 },
  { name: "Sealdah", lat: 22.5682, lng: 88.3701 },
];

const toRad = (d) => (d * Math.PI) / 180;
const haversine = (a, b) => {
  const r = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const geocode = (text) => {
  const normalized = String(text).toLowerCase();
  for (const key of Object.keys(KOLKATA_LANDMARKS).sort((a, b) => b.length - a.length)) {
    if (normalized.includes(key)) return { ...KOLKATA_LANDMARKS[key], matched: key };
  }
  return null;
};

const nearestMetro = (coord) =>
  METRO.map((m) => ({ ...m, distanceMeters: haversine(coord, m) })).sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

const kScore = (coord) => {
  const nearest = nearestMetro(coord);
  return Math.max(0, Math.min(100, Math.round(100 - (nearest.distanceMeters / 4000) * 100)));
};

const fingerprint = (item) =>
  `${item.headline.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60)}:${(item.area ?? "unknown").toLowerCase()}:${Math.round(Number(item.rent) / 1000)}`;

const cleaned = (text) => {
  const lower = text.toLowerCase();
  const bhk = (lower.match(/(\d+)\s*bhk/) || [])[1];
  return {
    bhk: bhk ? Number(bhk) : null,
    sharing: lower.includes("triple sharing")
      ? "triple"
      : lower.includes("double sharing")
      ? "double"
      : lower.includes("single sharing")
      ? "single"
      : "whole",
    furnishing: lower.includes("fully furnished")
      ? "furnished"
      : lower.includes("semi furnished") || lower.includes("semi-furnished")
      ? "semi_furnished"
      : "unfurnished",
    genderPref: lower.includes("female only")
      ? "female"
      : lower.includes("male only")
      ? "male"
      : lower.includes("couple")
      ? "couple_friendly"
      : "any",
    amenities: ["wifi", "ac", "geyser", "lift", "parking", "meals", "laundry"].filter((kw) =>
      lower.includes(kw)
    ),
  };
};

if (!fs.existsSync(inputPath)) {
  console.error(`No file at ${inputPath}`);
  process.exit(1);
}
const records = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const dedupe = new Set();
const unified = [];

records.forEach((record) => {
  const text = `${record.headline} ${record.details} ${record.location ?? ""}`;
  const geo = geocode(text);
  if (!geo) return;
  const c = cleaned(text);
  const rent = record.rentAmount ?? 0;
  if (rent < 1500) return;
  const fp = fingerprint({ headline: record.headline, area: geo.matched, rent });
  if (dedupe.has(fp)) return;
  dedupe.add(fp);
  const nearest = nearestMetro(geo);
  unified.push({
    source: record.source,
    externalId: record.externalId,
    title: record.headline.slice(0, 140),
    description: record.details,
    rent,
    deposit: Math.round(rent * 2),
    locality: geo.matched.replace(/(^|\s)\w/g, (m) => m.toUpperCase()),
    area_slug: slugify(geo.matched),
    lat: geo.lat,
    lng: geo.lng,
    sharing_type: c.sharing,
    furnished_status: c.furnishing,
    gender_pref: c.genderPref,
    bhk: c.bhk,
    amenities: c.amenities,
    nearest_metro: nearest.name,
    nearest_metro_distance: Math.round(nearest.distanceMeters),
    k_score: kScore(geo),
    dedupe_key: fp,
    url: record.url ?? null,
    contact_name: record.contactName ?? null,
    contact_phone: record.contactPhone ?? null,
    contact_email: record.contactEmail ?? null,
  });
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.log(JSON.stringify(unified, null, 2));
  console.error(
    "\nNo Supabase credentials in env (need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)."
  );
  console.error("Records were not written. Showing JSON above instead.");
  process.exit(0);
}

const insertUrl = `${SUPABASE_URL}/rest/v1/ingested_records`;
const payload = unified.map((u) => ({
  source_name: u.source,
  external_id: u.externalId,
  raw_payload: { ...u },
  normalized_payload: { ...u },
  dedupe_key: u.dedupe_key,
  confidence: 0.7,
  status: "queued",
}));

const response = await fetch(insertUrl, {
  method: "POST",
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const body = await response.text();
  console.error("Insert failed:", response.status, body);
  process.exit(1);
}
console.log(`Inserted ${unified.length} ingested records.`);
