import { redirect } from "next/navigation";
import { getCurrentProfile } from "../../../lib/supabase/profile";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { Section } from "../../../components/ui/Section";

export const dynamic = "force-dynamic";

export default async function AdminMetricsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/sign-in?redirect=/admin/metrics");
  if (profile.role !== "admin") {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">Admin only</h1>
      </main>
    );
  }

  const supabase = getSupabaseServer();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: liveCount },
    { count: directCount },
    { count: aggregatedCount },
    { count: pendingCount },
    { count: verifiedCount },
    { count: requests30 },
    { count: accepted30 },
    { count: members },
  ] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("publish_status", "live"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("source_type", "direct"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("source_type", "aggregated"),
    supabase
      .from("contact_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gt("created_at", since30),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("is_verified", true),
    supabase.from("contact_requests").select("id", { count: "exact", head: true }).gt("created_at", since30),
    supabase
      .from("contact_requests")
      .select("id", { count: "exact", head: true })
      .gt("created_at", since30)
      .eq("status", "accepted"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const acceptanceRate = (requests30 ?? 0) > 0 ? Math.round(((accepted30 ?? 0) / (requests30 ?? 1)) * 100) : 0;

  const metrics = [
    { label: "Live listings", value: liveCount ?? 0 },
    { label: "Direct provider listings", value: directCount ?? 0 },
    { label: "Aggregated listings", value: aggregatedCount ?? 0 },
    { label: "Verified listings", value: verifiedCount ?? 0 },
    { label: "Members", value: members ?? 0 },
    { label: "Requests (30d)", value: requests30 ?? 0 },
    { label: "Open requests", value: pendingCount ?? 0 },
    { label: "Acceptance rate (30d)", value: `${acceptanceRate}%` },
  ];

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-8 lg:px-8">
      <Section title="Operations metrics" subtitle="Snapshot of supply, demand and trust">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-3xl border border-ink-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-ink-500">{m.label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink-900">{m.value}</p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
