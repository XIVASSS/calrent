import type { RawIngestRecord } from "../pipeline";

export type SourceAdapter = {
  source: string;
  fetchListings: () => Promise<RawIngestRecord[]>;
};

export type RawSampleRecord = {
  source: string;
  externalId: string;
  headline: string;
  details: string;
  rentAmount?: number;
  location?: string;
  url?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
};
