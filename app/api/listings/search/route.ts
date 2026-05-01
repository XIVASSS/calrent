import { NextRequest, NextResponse } from "next/server";
import { listingSearchSchema, searchListings } from "../../../../lib/listings/queries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = listingSearchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 422 });
  }
  const listings = await searchListings(parsed.data);
  return NextResponse.json({ listings });
}
