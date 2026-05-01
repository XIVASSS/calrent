import { redirect } from "next/navigation";
import { getCurrentProfile } from "../../../lib/supabase/profile";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { Section } from "../../../components/ui/Section";
import { Badge } from "../../../components/ui/Badge";
import { ModerationActions } from "../../../components/admin/ModerationActions";
import { IngestRunner } from "../../../components/admin/IngestRunner";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/sign-in?redirect=/admin/moderation");
  if (profile.role !== "admin") {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">Admin only</h1>
        <p className="mt-2 text-sm text-ink-500">
          You need an admin role to access the moderation queue. Run{" "}
          <code className="rounded bg-ink-100 px-2 py-0.5">update profiles set role='admin' where id='{profile.id}';</code>
          {" "}in Supabase SQL editor to grant access to your account.
        </p>
      </main>
    );
  }

  const supabase = getSupabaseServer();
  const { data: queued } = await supabase
    .from("ingested_records")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: stats } = await supabase
    .from("ingested_records")
    .select("status");

  const counts = (stats ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-8 lg:px-8">
      <Section
        title="Moderation queue"
        subtitle="Review aggregated listings before they go live"
        rightSlot={<IngestRunner />}
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {(["queued", "approved", "rejected", "needs_changes"] as const).map((status) => (
            <div key={status} className="rounded-2xl border border-ink-100 bg-white p-3">
              <p className="text-[11px] uppercase tracking-wide text-ink-500">{status}</p>
              <p className="mt-1 text-2xl font-semibold text-ink-900">{counts[status] ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {(queued ?? []).length === 0 ? (
            <p className="rounded-3xl border border-dashed border-ink-200 p-8 text-center text-sm text-ink-500">
              Queue is clear.
            </p>
          ) : (
            (queued ?? []).map((row) => {
              const norm = (row.normalized_payload ?? {}) as Record<string, unknown>;
              return (
                <div key={row.id} className="rounded-3xl border border-ink-100 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warning">queued</Badge>
                    <Badge tone="soft">{row.source_name}</Badge>
                    <Badge tone="outline">conf {Number(row.confidence).toFixed(2)}</Badge>
                    {Boolean(norm.bhk) && <Badge tone="neutral">{`${norm.bhk} BHK`}</Badge>}
                    {Boolean(norm.kScore) && (
                      <Badge tone="metro">{`K-Score ${norm.kScore}`}</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-base font-semibold text-ink-900">{(norm.title as string) ?? "Untitled"}</p>
                  <p className="text-xs text-ink-500">
                    {(norm.locality as string) ?? "Unknown"} · ₹{(norm.rent as number) ?? "—"} · {(norm.sharing as string) ?? "—"}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-700">{(norm.description as string) ?? ""}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <span>External: {row.external_id}</span>
                    {Boolean(norm.url) && (
                      <a href={norm.url as string} target="_blank" rel="noreferrer" className="underline">
                        View source
                      </a>
                    )}
                  </div>
                  <div className="mt-3">
                    <ModerationActions recordId={row.id} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Section>
    </main>
  );
}
