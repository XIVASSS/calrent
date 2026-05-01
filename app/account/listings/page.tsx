import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "../../../lib/supabase/profile";
import { getMyListings } from "../../../lib/listings/queries";
import { Section } from "../../../components/ui/Section";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { formatINR } from "../../../lib/utils";
import { ListingActions } from "../../../components/account/ListingActions";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/sign-in?redirect=/account/listings");

  const listings = await getMyListings(profile.id);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 lg:px-8">
      <Section
        title="My listings"
        subtitle={`${listings.length} listing${listings.length === 1 ? "" : "s"} created`}
        rightSlot={
          <Button asChild>
            <Link href="/host/new">List another home</Link>
          </Button>
        }
      >
        {listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-10 text-center">
            <p className="font-semibold text-ink-900">No listings yet</p>
            <p className="mt-1 text-sm text-ink-500">Add a home to start receiving requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="grid grid-cols-1 items-center gap-4 rounded-3xl border border-ink-100 bg-white p-4 sm:grid-cols-[120px_1fr_auto]"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink-100">
                  {listing.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.cover_image} alt={listing.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-ink-400">No photo</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{listing.title}</p>
                  <p className="truncate text-sm text-ink-500">{listing.locality}, Kolkata</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <Badge tone={statusTone(listing.publish_status)}>{listing.publish_status}</Badge>
                    <span className="text-ink-600">{formatINR(listing.rent)}</span>
                    <span className="text-ink-500">{listing.bhk ? `${listing.bhk} BHK` : "Room"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/listing/${listing.id}`}>View</Link>
                  </Button>
                  <ListingActions listingId={listing.id} status={listing.publish_status} />
                </div>
              </div>
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
