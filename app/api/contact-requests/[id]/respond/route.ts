import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer, isSupabaseConfigured } from "../../../../../lib/supabase/server";

const schema = z.object({ decision: z.enum(["accepted", "declined"]) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 422 });
  }
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.rpc("respond_to_contact_request", {
    p_request_id: params.id,
    p_decision: parsed.data.decision,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ request: data });
}
