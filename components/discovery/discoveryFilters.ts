export type DiscoveryFilters = {
  query: string;
  minRent: number | null;
  maxRent: number | null;
  bhk: number[];
  sharing: string[];
  furnishing: string[];
  gender: "any" | "male" | "female" | "couple_friendly" | null;
  noBroker: boolean;
};

export const defaultFilters: DiscoveryFilters = {
  query: "",
  minRent: null,
  maxRent: null,
  bhk: [],
  sharing: [],
  furnishing: [],
  gender: null,
  noBroker: false,
};
