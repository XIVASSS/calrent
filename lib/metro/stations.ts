export type MetroLineId = "blue" | "green" | "purple" | "orange" | "yellow";

export type MetroStation = {
  name: string;
  lat: number;
  lng: number;
  alsoKnownAs?: string;
};

export type MetroLine = {
  id: MetroLineId;
  name: string;
  color: string;
  glow: string;
  stations: MetroStation[];
};

export const METRO_LINES: MetroLine[] = [
  {
    id: "blue",
    name: "Blue Line · 1",
    color: "#1e40af",
    glow: "rgba(30, 64, 175, 0.35)",
    stations: [
      { name: "Dakshineswar", lat: 22.65397, lng: 88.36372 },
      { name: "Baranagar", lat: 22.65353, lng: 88.37887 },
      { name: "Noapara", lat: 22.63972, lng: 88.39389 },
      { name: "Dum Dum", lat: 22.62111, lng: 88.39278 },
      { name: "Belgachhia", lat: 22.60583, lng: 88.38639 },
      { name: "Shyambazar", lat: 22.60131, lng: 88.37259 },
      { name: "Shobhabazar Sutanuti", lat: 22.59603, lng: 88.36529 },
      { name: "Girish Park", lat: 22.58714, lng: 88.36308 },
      { name: "Mahatma Gandhi Road", lat: 22.58086, lng: 88.36140 },
      { name: "Central", lat: 22.57247, lng: 88.35879 },
      { name: "Chandni Chowk", lat: 22.5668, lng: 88.35414 },
      { name: "Esplanade", lat: 22.56444, lng: 88.35167, alsoKnownAs: "Dharmatala" },
      { name: "Park Street", lat: 22.555, lng: 88.35028 },
      { name: "Maidan", lat: 22.54944, lng: 88.34889 },
      { name: "Rabindra Sadan", lat: 22.54139, lng: 88.34722 },
      { name: "Netaji Bhavan", lat: 22.53333, lng: 88.34611 },
      { name: "Jatin Das Park", lat: 22.52426, lng: 88.34649 },
      { name: "Kalighat", lat: 22.51665, lng: 88.346 },
      { name: "Rabindra Sarobar", lat: 22.50722, lng: 88.34556 },
      { name: "Mahanayak Uttam Kumar", lat: 22.49472, lng: 88.345, alsoKnownAs: "Tollygunge" },
      { name: "Netaji", lat: 22.481, lng: 88.346, alsoKnownAs: "Kudghat" },
      { name: "Masterda Surya Sen", lat: 22.4735, lng: 88.3609, alsoKnownAs: "Bansdroni" },
      { name: "Gitanjali", lat: 22.4708, lng: 88.3735, alsoKnownAs: "Naktala" },
      { name: "Kavi Nazrul", lat: 22.469, lng: 88.3823, alsoKnownAs: "Garia Bazar" },
      { name: "Shahid Khudiram", lat: 22.466, lng: 88.39167 },
      { name: "Kavi Subhash", lat: 22.47194, lng: 88.39806, alsoKnownAs: "New Garia" },
    ],
  },
  {
    id: "green",
    name: "Green Line · 2 (East-West)",
    color: "#16a34a",
    glow: "rgba(22, 163, 74, 0.32)",
    stations: [
      { name: "Howrah Maidan", lat: 22.582, lng: 88.333 },
      { name: "Howrah", lat: 22.58445, lng: 88.34058 },
      { name: "Mahakaran", lat: 22.57119, lng: 88.35011 },
      { name: "Esplanade", lat: 22.56444, lng: 88.35167 },
      { name: "Sealdah", lat: 22.56721, lng: 88.3715 },
      { name: "Phoolbagan", lat: 22.57214, lng: 88.39028 },
      { name: "Salt Lake Stadium", lat: 22.57306, lng: 88.40306 },
      { name: "Bengal Chemical", lat: 22.58008, lng: 88.40128 },
      { name: "City Centre", lat: 22.58707, lng: 88.40788 },
      { name: "Central Park", lat: 22.59044, lng: 88.41561 },
      { name: "Karunamoyee", lat: 22.58644, lng: 88.42152 },
      { name: "Salt Lake Sector V", lat: 22.58132, lng: 88.42982 },
    ],
  },
  {
    id: "purple",
    name: "Purple Line · 3",
    color: "#7c3aed",
    glow: "rgba(124, 58, 237, 0.32)",
    stations: [
      { name: "Joka", lat: 22.45224, lng: 88.30175 },
      { name: "Thakurpukur", lat: 22.46426, lng: 88.30756 },
      { name: "Sakherbazar", lat: 22.47461, lng: 88.30999 },
      { name: "Behala Chowrasta", lat: 22.48753, lng: 88.31343 },
      { name: "Behala Bazar", lat: 22.49893, lng: 88.31735 },
      { name: "Taratala", lat: 22.50817, lng: 88.32056 },
      { name: "Majerhat", lat: 22.5191, lng: 88.3234 },
    ],
  },
  {
    id: "orange",
    name: "Orange Line · 6",
    color: "#ea580c",
    glow: "rgba(234, 88, 12, 0.32)",
    stations: [
      { name: "Kavi Subhash", lat: 22.47194, lng: 88.39806 },
      { name: "Satyajit Ray", lat: 22.4846, lng: 88.3926 },
      { name: "Jyotirindra Nandi", lat: 22.49592, lng: 88.39867 },
      { name: "Kavi Sukanta", lat: 22.50526, lng: 88.401 },
      { name: "Hemanta Mukhopadhyay", lat: 22.51478, lng: 88.40147 },
      { name: "VIP Bazar", lat: 22.5255, lng: 88.39586 },
      { name: "Ritwik Ghatak", lat: 22.53286, lng: 88.39576 },
      { name: "Beleghata", lat: 22.5507, lng: 88.40409 },
      { name: "Barun Sengupta", lat: 22.54399, lng: 88.39 },
    ],
  },
  {
    id: "yellow",
    name: "Yellow Line · 4",
    color: "#eab308",
    glow: "rgba(234, 179, 8, 0.32)",
    stations: [
      { name: "Noapara", lat: 22.63972, lng: 88.39389 },
      { name: "Dum Dum Cantonment", lat: 22.638, lng: 88.4123 },
      { name: "Jessore Road", lat: 22.63951, lng: 88.42978 },
      { name: "Jai Hind", lat: 22.64619, lng: 88.43591, alsoKnownAs: "Airport" },
    ],
  },
];

export function flatMetroStations(): Array<MetroStation & { lineId: MetroLineId; color: string }> {
  return METRO_LINES.flatMap((line) =>
    line.stations.map((station) => ({ ...station, lineId: line.id, color: line.color }))
  );
}
