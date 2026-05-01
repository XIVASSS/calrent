import type { RawIngestRecord } from "../pipeline";
import type { RawSampleRecord } from "./source-types";

export function fromMagicBricks(record: RawSampleRecord): RawIngestRecord {
  return {
    source: "magicbricks",
    externalId: record.externalId,
    headline: record.headline,
    details: record.details,
    location: record.location,
    rentAmount: record.rentAmount,
    url: record.url,
    contactName: record.contactName,
    contactPhone: record.contactPhone,
    contactEmail: record.contactEmail,
  };
}
