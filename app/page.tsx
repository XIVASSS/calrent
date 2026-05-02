import { DiscoveryShell } from "../components/discovery/DiscoveryShell";
import { searchListings, KOLKATA_DEFAULT_BOUNDS } from "../lib/listings/queries";
import { getCurrentProfile } from "../lib/supabase/profile";
import { getSupabaseServer } from "../lib/supabase/server";
import { QuickActionFab } from "../components/quick-add/QuickActionFab";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const initialListings = await searchListings(KOLKATA_DEFAULT_BOUNDS);
  const mapApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY ?? "";
  const profile = await getCurrentProfile();
  let shortlistIds: string[] = [];
  if (profile) {
    const supabase = getSupabaseServer();
    const { data } = await supabase.from("shortlists").select("listing_id").eq("user_id", profile.id);
    shortlistIds = (data ?? []).map((row) => row.listing_id);
  }
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col px-4 pb-28 pt-4 max-lg:min-h-0 max-lg:flex-1 lg:flex-none lg:px-8 lg:pb-12">
      <DiscoveryShell
        initialListings={initialListings}
        initialShortlist={shortlistIds}
        isAuthenticated={Boolean(profile)}
        mapApiKey={mapApiKey}
      />
      <QuickActionFab />
    </main>
  );
}
