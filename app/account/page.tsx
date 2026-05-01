import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "../../lib/supabase/profile";
import { getMyListings } from "../../lib/listings/queries";
import { getSupabaseServer } from "../../lib/supabase/server";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Section } from "../../components/ui/Section";
import { Badge } from "../../components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/sign-in?redirect=/account");

  const listings = await getMyListings(profile.id);
  const supabase = getSupabaseServer();
  const { count: pendingRequestsCount } = await supabase
    .from("contact_requests")
    .select("id", { count: "exact", head: true })
    .or(`requester_id.eq.${profile.id},provider_id.eq.${profile.id}`)
    .eq("status", "pending");

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar size={56} name={profile.full_name ?? "Member"} src={profile.avatar_url} />
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">
              {profile.full_name ?? "Member"}
            </h1>
            <p className="text-sm text-ink-500">{profile.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="primary"><Link href="/host/new">List a new home</Link></Button>
          <Button asChild variant="outline"><Link href="/auth/sign-out">Sign out</Link></Button>
        </div>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="My listings" value={listings.length} href="/account/listings" />
        <StatCard label="Open contact requests" value={pendingRequestsCount ?? 0} href="/account/inbox" />
        <StatCard label="Trust score" value={profile.trust_score} />
      </div>

      <Section title="My listings" className="mt-10" rightSlot={<Link href="/account/listings" className="text-sm font-medium text-ink-700 underline-offset-4 hover:underline">Manage all</Link>}>
        {listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center">
            <p className="text-base font-semibold text-ink-900">You haven't listed a home yet.</p>
            <p className="mt-1 text-sm text-ink-500">Add your first listing to start receiving requests.</p>
            <div className="mt-4">
              <Button asChild><Link href="/host/new">List a home</Link></Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.slice(0, 6).map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="group rounded-3xl border border-ink-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-card"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-ink-100">
                  {listing.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.cover_image} alt={listing.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-ink-400">No photo</div>
                  )}
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-ink-900">{listing.title}</p>
                <p className="text-xs text-ink-500">{listing.locality}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Badge tone={statusTone(listing.publish_status)}>{listing.publish_status}</Badge>
                  <span className="text-ink-600">₹{listing.rent}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}

function statusTone(status: string) {
  if (status === "live") return "verified" as const;
  if (status === "pending_review") return "warning" as const;
  if (status === "rejected") return "accent" as const;
  return "soft" as const;
}

function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-card">
      <p className="text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
