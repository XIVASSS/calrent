export const KOLKATA_LANDMARKS: Record<string, { lat: number; lng: number }> = {
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
  "kavi subhash": { lat: 22.4812, lng: 88.3924 },
  esplanade: { lat: 22.5658, lng: 88.3527 },
};

export function guessKolkataCoordinate(text: string): { lat: number; lng: number; matched: string } | null {
  const normalized = text.toLowerCase();
  for (const key of Object.keys(KOLKATA_LANDMARKS).sort((a, b) => b.length - a.length)) {
    if (normalized.includes(key)) {
      return { ...KOLKATA_LANDMARKS[key], matched: key };
    }
  }
  return null;
}

export function slugifyLocality(locality: string): string {
  return locality
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
