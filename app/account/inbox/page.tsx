import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "../../../lib/supabase/profile";
import { getSupabaseServer } from "../../../lib/supabase/server";
import { Section } from "../../../components/ui/Section";
import { Badge } from "../../../components/ui/Badge";
import { relativeTime } from "../../../lib/utils";
import { RespondButtons } from "../../../components/inbox/RespondButtons";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  listing: { id: string; title: string; locality: string; rent: number; cover_image: string | null } | null;
  requester: { id: string; full_name: string | null; avatar_url: string | null } | null;
  provider: { id: string; full_name: string | null; avatar_url: string | null } | null;
};

export default async function InboxPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/sign-in?redirect=/account/inbox");
  const supabase = getSupabaseServer();

  const { data: incoming } = await supabase
    .from("contact_requests")
    .select(
      "id, status, message, created_at, listing:listings(id, title, locality, rent, cover_image), requester:profiles!contact_requests_requester_id_fkey(id, full_name, avatar_url), provider:profiles!contact_requests_provider_id_fkey(id, full_name, avatar_url)"
    )
    .eq("provider_id", profile.id)
    .order("created_at", { ascending: false });

  const { data: outgoing } = await supabase
    .from("contact_requests")
    .select(
      "id, status, message, created_at, listing:listings(id, title, locality, rent, cover_image), requester:profiles!contact_requests_requester_id_fkey(id, full_name, avatar_url), provider:profiles!contact_requests_provider_id_fkey(id, full_name, avatar_url)"
    )
    .eq("requester_id", profile.id)
    .order("created_at", { ascending: false });

  const incomingRows = (incoming ?? []) as unknown as RequestRow[];
  const outgoingRows = (outgoing ?? []) as unknown as RequestRow[];

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-8 lg:px-8">
      <Section title="Contact requests" subtitle="Manage who can see your phone and email">
        <h2 className="text-lg font-semibold text-ink-900">From renters</h2>
        {incomingRows.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">No incoming requests yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {incomingRows.map((row) => (
              <RequestCard key={row.id} row={row} mode="incoming" />
            ))}
          </ul>
        )}

        <h2 className="mt-8 text-lg font-semibold text-ink-900">Your requests</h2>
        {outgoingRows.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">You haven't requested any contacts yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {outgoingRows.map((row) => (
              <RequestCard key={row.id} row={row} mode="outgoing" />
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}

function RequestCard({ row, mode }: { row: RequestRow; mode: "incoming" | "outgoing" }) {
  const peer = mode === "incoming" ? row.requester : row.provider;
  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-ink-100 bg-white p-4 sm:flex-row sm:items-center">
      {row.listing?.cover_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.listing.cover_image}
          alt={row.listing.title}
          className="h-24 w-full rounded-2xl object-cover sm:w-32"
        />
      ) : (
        <div className="grid h-24 w-full place-items-center rounded-2xl bg-ink-100 text-xs text-ink-400 sm:w-32">
          No photo
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(row.status)}>{row.status}</Badge>
          <Link
            href={`/listing/${row.listing?.id}`}
            className="truncate text-sm font-semibold text-ink-900 underline-offset-4 hover:underline"
          >
            {row.listing?.title ?? "Listing"}
          </Link>
          <span className="text-xs text-ink-500">{relativeTime(row.created_at)}</span>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          {mode === "incoming" ? "From" : "To"}: {peer?.full_name ?? "Member"}
        </p>
        {row.message && (
          <p className="mt-2 line-clamp-2 text-sm text-ink-700">"{row.message}"</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {mode === "incoming" && row.status === "pending" && (
          <RespondButtons requestId={row.id} />
        )}
        {row.status === "accepted" && (
          <Link
            href={`/listing/${row.listing?.id}`}
            className="text-sm font-semibold text-ink-900 underline-offset-4 hover:underline"
          >
            View contact
          </Link>
        )}
      </div>
    </li>
  );
}

function statusTone(status: string) {
  if (status === "accepted") return "verified" as const;
  if (status === "pending") return "warning" as const;
  if (status === "declined") return "accent" as const;
  return "soft" as const;
}
