import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { runIngestionPipeline, type RawIngestRecord } from "../../../../lib/ingest/pipeline";
import sample from "../../../../lib/ingest/sample-sources.json";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  records: z
    .array(
      z.object({
        source: z.string(),
        externalId: z.string(),
        headline: z.string(),
        details: z.string(),
        rentAmount: z.number().optional(),
        location: z.string().optional(),
        url: z.string().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
      })
    )
    .optional(),
});

async function ensureAdmin() {
  const supabase = getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") return null;
  return supabase;
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }
  const supabase = await ensureAdmin();
  if (!supabase) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 422 });

  const records = (parsed.data.records ?? (sample as RawIngestRecord[])) as RawIngestRecord[];
  const result = runIngestionPipeline(records);

  if (result.records.length === 0) {
    return NextResponse.json({ inserted: 0, ...result });
  }

  // Insert/upsert ingested_records
  const inserts = result.records.map((record) => ({
    source_name: record.source,
    external_id: record.externalId,
    raw_payload: records.find((r) => r.externalId === record.externalId) ?? {},
    normalized_payload: record,
    dedupe_key: record.dedupeKey,
    confidence: record.confidence,
    status: "queued" as const,
  }));

  const { error } = await supabase.from("ingested_records").insert(inserts);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    inserted: inserts.length,
    rawCount: result.rawCount,
    duplicates: result.duplicateCount,
    geocodeFailures: result.geocodeFailures,
  });
}
