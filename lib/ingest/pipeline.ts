import { cleanListingText, type CleanedListing } from "./nlp-cleaner";
import { geocodeKolkataText } from "./geocode-kolkata";
import { getKScore, getNearestMetro } from "./connectivity-score";

export type RawIngestRecord = {
  source: string;
  externalId: string;
  headline: string;
  details: string;
  location?: string;
  rentAmount?: number;
  url?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
};

export type NormalizedRecord = {
  source: string;
  externalId: string;
  title: string;
  description: string;
  rent: number;
  deposit: number | null;
  lat: number;
  lng: number;
  bhk: number | null;
  rooms: number | null;
  area: string | null;
  locality: string;
  area_slug: string;
  sharing: NonNullable<CleanedListing["sharing"]> | "whole";
  furnishing: NonNullable<CleanedListing["furnishing"]> | "semi_furnished";
  amenities: string[];
  vibeTags: string[];
  genderPref: "any" | "male" | "female" | "couple_friendly";
  restrictions: Record<string, unknown>;
  nearestMetro: string;
  metroDistanceMeters: number;
  kScore: number;
  url: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  dedupeKey: string;
  confidence: number;
};

function fingerprint(record: { headline: string; area: string | null; rent: number }) {
  const headlineNorm = record.headline.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 60);
  const areaNorm = (record.area ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return `${headlineNorm}:${areaNorm}:${Math.round(record.rent / 1000)}`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

function confidenceFor({ hasGeo, hasBhk, descriptionLength, hasContact }: { hasGeo: boolean; hasBhk: boolean; descriptionLength: number; hasContact: boolean }) {
  let score = 0.4;
  if (hasGeo) score += 0.3;
  if (hasBhk) score += 0.12;
  if (descriptionLength > 80) score += 0.1;
  if (hasContact) score += 0.08;
  return Number(Math.min(1, score).toFixed(2));
}

export type IngestionOutcome = {
  rawCount: number;
  normalizedCount: number;
  duplicateCount: number;
  geocodeFailures: number;
  records: NormalizedRecord[];
};

export function runIngestionPipeline(records: RawIngestRecord[]): IngestionOutcome {
  const dedupe = new Set<string>();
  const normalized: NormalizedRecord[] = [];
  let duplicates = 0;
  let geocodeFailures = 0;

  records.forEach((record) => {
    const cleaned = cleanListingText({
      headline: record.headline,
      details: record.details,
      location: record.location,
    });
    const geo = geocodeKolkataText(`${record.location ?? ""} ${record.details} ${cleaned.area ?? ""}`);
    if (!geo) {
      geocodeFailures += 1;
      return;
    }
    const rent = cleaned.rent ?? record.rentAmount ?? 0;
    if (rent < 1500) return;
    const dedupeKey = fingerprint({ headline: record.headline, area: cleaned.area, rent });
    if (dedupe.has(dedupeKey)) {
      duplicates += 1;
      return;
    }
    dedupe.add(dedupeKey);

    const nearest = getNearestMetro({ lat: geo.lat, lng: geo.lng });
    const kScore = getKScore({ lat: geo.lat, lng: geo.lng });
    const locality = (cleaned.area ?? geo.matched).replace(/(^|\s)\w/g, (m) => m.toUpperCase());
    const sharing: NormalizedRecord["sharing"] = cleaned.sharing ?? "whole";
    const furnishing: NormalizedRecord["furnishing"] = cleaned.furnishing ?? "semi_furnished";

    normalized.push({
      source: record.source,
      externalId: record.externalId,
      title: record.headline.slice(0, 140),
      description: record.details,
      rent,
      deposit: cleaned.deposit ?? Math.round(rent * 2),
      lat: geo.lat,
      lng: geo.lng,
      bhk: cleaned.bhk,
      rooms: cleaned.rooms,
      area: cleaned.area,
      locality,
      area_slug: slugify(locality),
      sharing,
      furnishing,
      amenities: cleaned.amenities,
      vibeTags: cleaned.vibeTags,
      genderPref: cleaned.restrictions.genderPref ?? "any",
      restrictions: cleaned.restrictions,
      nearestMetro: nearest.station.name,
      metroDistanceMeters: Math.round(nearest.distanceMeters),
      kScore,
      url: record.url ?? null,
      contactName: record.contactName ?? null,
      contactPhone: record.contactPhone ?? null,
      contactEmail: record.contactEmail ?? null,
      dedupeKey,
      confidence: confidenceFor({
        hasGeo: true,
        hasBhk: Boolean(cleaned.bhk),
        descriptionLength: record.details.length,
        hasContact: Boolean(record.contactPhone || record.contactEmail),
      }),
    });
  });

  return {
    rawCount: records.length,
    normalizedCount: normalized.length,
    duplicateCount: duplicates,
    geocodeFailures,
    records: normalized,
  };
}
