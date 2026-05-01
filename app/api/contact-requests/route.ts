import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, isSupabaseConfigured } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().max(800).nullable().optional(),
});

const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 8;

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 422 });
  }

  const supabase = getSupabaseServer();
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, provider_id, publish_status")
    .eq("id", parsed.data.listingId)
    .maybeSingle();
  if (listingError || !listing) {
    return NextResponse.json({ error: "listing_not_found" }, { status: 404 });
  }
  if (listing.publish_status !== "live") {
    return NextResponse.json({ error: "listing_not_live" }, { status: 400 });
  }
  if (!listing.provider_id) {
    return NextResponse.json({ error: "listing_has_no_provider" }, { status: 400 });
  }
  if (listing.provider_id === userResult.user.id) {
    return NextResponse.json({ error: "cannot_request_own_listing" }, { status: 400 });
  }

  // Anti-spam: cap requests per hour per requester.
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count: recentCount } = await supabase
    .from("contact_requests")
    .select("id", { count: "exact", head: true })
    .eq("requester_id", userResult.user.id)
    .gt("created_at", since);
  if ((recentCount ?? 0) >= MAX_REQUESTS_PER_HOUR) {
    return NextResponse.json({ error: "rate_limited", retryAfterMinutes: 60 }, { status: 429 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: insertResult, error: insertError } = await supabase
    .from("contact_requests")
    .upsert(
      {
        listing_id: listing.id,
        requester_id: userResult.user.id,
        provider_id: listing.provider_id,
        message: parsed.data.message ?? null,
        status: "pending",
        expires_at: expiresAt,
      },
      { onConflict: "listing_id,requester_id" }
    )
    .select("id, status")
    .single();
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ id: insertResult.id, status: insertResult.status });
}
