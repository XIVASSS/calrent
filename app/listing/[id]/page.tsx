import { notFound } from "next/navigation";
import { getListingById } from "../../../lib/listings/queries";
import { getCurrentProfile } from "../../../lib/supabase/profile";
import { ListingDetail } from "../../../components/listing/ListingDetail";
import { getSupabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export default async function ListingDetailPage({ params }: Params) {
  const listing = await getListingById(params.id);
  if (!listing) notFound();
  const profile = await getCurrentProfile();

  // Existing contact request from current user
  let existingRequest = null;
  let revealedContact: { name: string | null; phone: string | null; email: string | null } | null = null;

  if (profile) {
    const supabase = getSupabaseServer();
    const { data: requests } = await supabase
      .from("contact_requests")
      .select("id, status, created_at")
      .eq("listing_id", listing.id)
      .eq("requester_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existingRequest = requests ?? null;

    if (existingRequest && existingRequest.status === "accepted") {
      const { data: reveal } = await supabase
        .from("contact_reveals")
        .select("revealed_name, revealed_phone, revealed_email")
        .eq("contact_request_id", existingRequest.id)
        .eq("revealed_to", profile.id)
        .maybeSingle();
      if (reveal) {
        revealedContact = {
          name: reveal.revealed_name,
          phone: reveal.revealed_phone,
          email: reveal.revealed_email,
        };
      }
    }
  }

  return (
    <ListingDetail
      listing={listing}
      currentUser={profile}
      existingRequest={existingRequest}
      revealedContact={revealedContact}
    />
  );
}
