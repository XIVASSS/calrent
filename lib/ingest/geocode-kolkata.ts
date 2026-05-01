import { KOLKATA_LANDMARKS, guessKolkataCoordinate } from "../listings/geocode";

export function geocodeKolkataText(text: string): { lat: number; lng: number; matched: string } | null {
  const guess = guessKolkataCoordinate(text);
  if (guess) return guess;
  return null;
}

export { KOLKATA_LANDMARKS };
