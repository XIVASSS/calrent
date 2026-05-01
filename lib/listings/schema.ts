import { z } from "zod";

export const listingDraftSchema = z.object({
  title: z.string().min(8).max(140),
  description: z.string().min(40).max(4000),
  property_type: z.enum(["flat", "room", "pg", "studio"]),
  bhk: z.number().int().min(1).max(8).nullable().optional(),
  rooms_count: z.number().int().min(1).max(10).nullable().optional(),
  sharing_type: z.enum(["single", "double", "triple", "private_room", "whole"]),
  occupancy_max: z.number().int().min(1).max(20).nullable().optional(),
  rent: z.number().int().min(1500).max(500000),
  deposit: z.number().int().min(0).max(10_000_000).nullable().optional(),
  maintenance: z.number().int().min(0).max(50000).nullable().optional(),
  furnished_status: z.enum(["furnished", "semi_furnished", "unfurnished"]),
  available_from: z.string().nullable().optional(),
  locality: z.string().min(2).max(80),
  area_slug: z.string().min(2).max(80),
  city: z.string().min(2).max(40).default("Kolkata"),
  lat: z.number().min(22.3).max(22.85),
  lng: z.number().min(88.1).max(88.7),
  gender_pref: z.enum(["any", "male", "female", "couple_friendly"]).default("any"),
  amenities: z.array(z.string()).default([]),
  restrictions: z.record(z.string(), z.unknown()).default({}),
  cover_image: z.string().url().nullable().optional(),
  source_contact_name: z.string().min(2).max(80),
  source_contact_phone: z.string().min(7).max(20),
  source_contact_email: z.string().email().nullable().optional(),
});

export type ListingDraftInput = z.infer<typeof listingDraftSchema>;

export const listingPublishSchema = z.object({
  id: z.string().uuid(),
  publish: z.boolean().default(true),
});
