/**
 * Seed live Kolkata listings (run after empty DB / project restore).
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/seed-kolkata-listings.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const AREAS = [
  { locality: "Salt Lake Sector V", slug: "salt-lake-sector-v", lat: 22.5798, lng: 88.4304 },
  { locality: "New Town Action Area I", slug: "new-town", lat: 22.5755, lng: 88.4794 },
  { locality: "Park Street", slug: "park-street", lat: 22.5531, lng: 88.3526 },
  { locality: "Garia", slug: "garia", lat: 22.4628, lng: 88.3911 },
  { locality: "Tollygunge", slug: "tollygunge", lat: 22.5152, lng: 88.3676 },
  { locality: "New Alipore", slug: "new-alipore", lat: 22.5109, lng: 88.3326 },
  { locality: "Ruby", slug: "ruby", lat: 22.5173, lng: 88.4005 },
  { locality: "Ballygunge", slug: "ballygunge", lat: 22.5298, lng: 88.3647 },
  { locality: "Jadavpur", slug: "jadavpur", lat: 22.4988, lng: 88.371 },
  { locality: "Dum Dum", slug: "dumdum", lat: 22.6208, lng: 88.4208 },
  { locality: "Behala", slug: "behala", lat: 22.4945, lng: 88.3137 },
  { locality: "Lake Gardens", slug: "lake-gardens", lat: 22.502, lng: 88.3625 },
];

const SHARING = ["whole", "single", "double", "private_room", "triple"];
const FURNISH = ["furnished", "semi_furnished", "unfurnished"];
const SOURCES = ["nobroker", "housing", "99acres", "magicbricks"];

function buildRows(count = 132) {
  const rows = [];
  for (let n = 1; n <= count; n++) {
    const area = AREAS[(n - 1) % AREAS.length];
    const bhk = (n % 3) + 1;
    const sharing = SHARING[n % SHARING.length];
    const rent = 7000 + ((n * 791) % 32000);
    const lat = area.lat + (((n * 17) % 1000) - 500) * 0.00001;
    const lng = area.lng + (((n * 23) % 1000) - 500) * 0.00001;
    const sourceType = n % 4 === 0 ? "direct" : "aggregated";
    rows.push({
      title: `${bhk} BHK ${sharing === "whole" ? "flat" : "room"} in ${area.locality}`,
      description: `Bright ${bhk} BHK home in ${area.locality}, Kolkata. Metro-friendly, wifi, lift, geyser. Ideal for working professionals and families.`,
      property_type: n % 11 === 0 ? "studio" : n % 13 === 0 ? "pg" : "flat",
      bhk,
      rooms_count: sharing === "whole" ? bhk : 1,
      sharing_type: sharing,
      rent,
      deposit: rent * 2,
      furnished_status: FURNISH[n % FURNISH.length],
      locality: area.locality,
      area_slug: area.slug,
      city: "Kolkata",
      lat,
      lng,
      gender_pref: n % 9 === 0 ? "female" : n % 10 === 0 ? "male" : "any",
      restrictions: {},
      amenities: ["wifi", "geyser", "lift"],
      source_type: sourceType,
      source_name: sourceType === "aggregated" ? SOURCES[n % SOURCES.length] : null,
      publish_status: "live",
      is_verified: n % 7 === 0,
      k_score: 55 + (n % 40),
      cover_image: `https://picsum.photos/seed/calrent-${n}/800/600`,
      gated_society: n % 3 === 0,
      square_feet: 650 + (n % 8) * 120,
      parking_count: n % 4 === 0 ? 1 : 0,
      pet_policy: n % 5 === 0 ? "yes" : "no",
      tenant_type: n % 6 === 0 ? "family" : "bachelor",
      includes_maintenance: n % 8 === 0,
    });
  }
  return rows;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const rows = buildRows();
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/listings`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    console.error("Seed failed:", res.status, await res.text());
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} live listings.`);
}

main();
