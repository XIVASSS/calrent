import { redirect } from "next/navigation";
import { getCurrentProfile } from "../../../lib/supabase/profile";
import { HostListingWizard } from "../../../components/host/HostListingWizard";

export const dynamic = "force-dynamic";

export default async function NewHostListingPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/auth/sign-in?redirect=/host/new");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">List your home in Kolkata</h1>
      <p className="mt-2 text-sm text-ink-500">
        Fill in the details below. Your listing goes live immediately. Your phone and email stay private until you accept a renter's request.
      </p>
      <div className="mt-8">
        <HostListingWizard
          profile={{
            id: profile.id,
            full_name: profile.full_name ?? "",
            phone: profile.phone ?? "",
            email: profile.email ?? "",
          }}
        />
      </div>
    </main>
  );
}
