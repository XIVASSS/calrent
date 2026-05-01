export type MetroStation = {
  name: string;
  line: "Blue" | "Green" | "Purple";
  lat: number;
  lng: number;
};

export const KOLKATA_METRO_STATIONS: MetroStation[] = [
  { name: "Kavi Subhash", line: "Blue", lat: 22.4812, lng: 88.3924 },
  { name: "Rabindra Sadan", line: "Blue", lat: 22.5448, lng: 88.3458 },
  { name: "Esplanade", line: "Blue", lat: 22.5658, lng: 88.3527 },
  { name: "Dumdum", line: "Blue", lat: 22.6208, lng: 88.4208 },
  { name: "Howrah Maidan", line: "Green", lat: 22.5925, lng: 88.3117 },
  { name: "Salt Lake Sector V", line: "Green", lat: 22.5798, lng: 88.4304 },
  { name: "Sealdah", line: "Green", lat: 22.5682, lng: 88.3701 },
  { name: "Joka", line: "Purple", lat: 22.4372, lng: 88.3115 },
];
