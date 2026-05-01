import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { z } from "zod";

const updateSchema = z.object({
  publish_status: z.enum(["draft", "pending_review", "live", "rejected", "archived"]).optional(),
  cover_image: z.string().url().nullable().optional(),
  rent: z.number().int().min(1500).max(500000).optional(),
  description: z.string().min(40).max(4000).optional(),
  amenities: z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 422 });
  }
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("listings").update(parsed.data).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("listings").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
