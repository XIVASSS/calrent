import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "../../../lib/supabase/profile";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { Section } from "../../../components/ui/Section";
import { ShortlistCompare } from "../../../components/account/ShortlistCompare";
import type { PublicListing, ListingRow } from "../../../lib/supabase/types";
import { Button } from "../../../components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ShortlistPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/sign-in?redirect=/account/shortlist");

  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("shortlists")
    .select(
      "listing_id, listing:listings(id, title, locality, area_slug, city, lat, lng, rent, deposit, bhk, sharing_type, furnished_status, gender_pref, amenities, source_type, source_name, is_verified, k_score, cover_image, available_from, publish_status, created_at, updated_at, description, occupancy_max, maintenance, property_type, rooms_count, restrictions, source_url)"
    )
    .eq("user_id", profile.id);

  const rawRows = (data ?? []) as unknown as Array<{ listing: ListingRow | ListingRow[] | null }>;
  const listings: PublicListing[] = rawRows
    .map((row) => (Array.isArray(row.listing) ? row.listing[0] ?? null : row.listing))
    .filter((listing): listing is ListingRow => Boolean(listing))
    .map((listing) => ({ ...listing, has_contact: false }) as unknown as PublicListing);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 lg:px-8">
      <Section title="Your shortlist" subtitle="Compare your saved homes side by side">
        {listings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-10 text-center">
            <p className="text-base font-semibold text-ink-900">No homes shortlisted yet</p>
            <p className="mt-1 text-sm text-ink-500">Tap the heart on any home to add it here.</p>
            <div className="mt-4">
              <Button asChild><Link href="/">Discover homes</Link></Button>
            </div>
          </div>
        ) : (
          <ShortlistCompare listings={listings} />
        )}
      </Section>
    </main>
  );
}
