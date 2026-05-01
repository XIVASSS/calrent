export type CleanedListing = {
  bhk: number | null;
  rooms: number | null;
  rent: number | null;
  deposit: number | null;
  area: string | null;
  amenities: string[];
  restrictions: {
    allowNonveg: boolean | null;
    allowPets: boolean | null;
    genderPref: "any" | "male" | "female" | "couple_friendly" | null;
  };
  sharing: "single" | "double" | "triple" | "private_room" | "whole" | null;
  furnishing: "furnished" | "semi_furnished" | "unfurnished" | null;
  vibeTags: string[];
};

const AMENITY_KEYWORDS: Record<string, string> = {
  wifi: "wifi",
  "wi-fi": "wifi",
  ac: "ac",
  geyser: "geyser",
  lift: "lift",
  parking: "parking",
  gym: "gym",
  pool: "swimming pool",
  meals: "meals included",
  laundry: "laundry",
  security: "24x7 security",
  power: "power backup",
  pet: "pet friendly",
};

export function cleanListingText(input: { headline: string; details: string; location?: string }): CleanedListing {
  const text = `${input.headline} ${input.details} ${input.location ?? ""}`.toLowerCase();

  const bhkMatch = text.match(/(\d+)\s*bhk/);
  const roomsMatch = text.match(/(\d+)\s*room/);
  const rentMatch = text.match(/(?:rent|price)[^\d]{0,4}(\d{4,7})/);
  const depositMatch = text.match(/deposit[^\d]{0,4}(\d{4,7})/);

  const sharing: CleanedListing["sharing"] = text.includes("triple sharing")
    ? "triple"
    : text.includes("double sharing")
    ? "double"
    : text.includes("single sharing")
    ? "single"
    : text.includes("private room")
    ? "private_room"
    : text.includes("entire") || text.includes("whole flat")
    ? "whole"
    : null;

  const furnishing: CleanedListing["furnishing"] = text.includes("fully furnished")
    ? "furnished"
    : text.includes("semi furnished") || text.includes("semi-furnished")
    ? "semi_furnished"
    : text.includes("unfurnished")
    ? "unfurnished"
    : null;

  const amenities = Object.keys(AMENITY_KEYWORDS)
    .filter((kw) => text.includes(kw))
    .map((kw) => AMENITY_KEYWORDS[kw]);
  const amenitySet = Array.from(new Set(amenities));

  const tags: string[] = [];
  if (text.includes("quiet")) tags.push("Quiet");
  if (text.includes("remote") || text.includes("work from home")) tags.push("Remote-friendly");
  if (text.includes("family")) tags.push("Family-friendly");
  if (text.includes("students")) tags.push("Student-friendly");
  if (text.includes("balcony")) tags.push("Balcony");
  if (text.includes("metro")) tags.push("Near metro");

  const genderPref: CleanedListing["restrictions"]["genderPref"] = text.includes("female only")
    ? "female"
    : text.includes("male only")
    ? "male"
    : text.includes("couple")
    ? "couple_friendly"
    : null;

  return {
    bhk: bhkMatch ? Number(bhkMatch[1]) : null,
    rooms: roomsMatch ? Number(roomsMatch[1]) : null,
    rent: rentMatch ? Number(rentMatch[1]) : null,
    deposit: depositMatch ? Number(depositMatch[1]) : null,
    area: extractKolkataArea(text),
    amenities: amenitySet,
    restrictions: {
      allowNonveg: text.includes("non-veg") || text.includes("nonveg") ? true : text.includes("veg only") ? false : null,
      allowPets: text.includes("pets allowed") ? true : text.includes("no pets") ? false : null,
      genderPref,
    },
    sharing,
    furnishing,
    vibeTags: tags,
  };
}

import { KOLKATA_LANDMARKS } from "../listings/geocode";

function extractKolkataArea(text: string): string | null {
  for (const key of Object.keys(KOLKATA_LANDMARKS).sort((a, b) => b.length - a.length)) {
    if (text.includes(key)) return key;
  }
  return null;
}
