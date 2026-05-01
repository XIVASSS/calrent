"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ShieldCheck,
  Star,
  MapPin,
  Wifi,
  Lock,
  ChevronLeft,
  ParkingMeter,
  ShowerHead,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  User as UserIcon,
} from "lucide-react";
import type { PublicListing, ProfileRow } from "../../lib/supabase/types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Textarea } from "../ui/Input";
import { formatINR, formatRentCompact, maskEmail, maskPhone } from "../../lib/utils";
import { getSupabaseBrowser } from "../../lib/supabase/browser";

type ListingDetailProps = {
  listing: PublicListing;
  currentUser: ProfileRow | null;
  existingRequest:
    | {
        id: string;
        status: string;
        created_at: string;
      }
    | null;
  revealedContact: { name: string | null; phone: string | null; email: string | null } | null;
};

const SHARING_LABEL: Record<string, string> = {
  single: "Single sharing",
  double: "Double sharing",
  triple: "Triple sharing",
  private_room: "Private room",
  whole: "Entire home",
};

const FURNISHING_LABEL: Record<string, string> = {
  furnished: "Furnished",
  semi_furnished: "Semi-furnished",
  unfurnished: "Unfurnished",
};

export function ListingDetail({
  listing,
  currentUser,
  existingRequest,
  revealedContact,
}: ListingDetailProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState(existingRequest?.status ?? null);
  const [error, setError] = useState<string | null>(null);

  const isOwnListing = currentUser?.id === listing.provider_id;
  const canRequestContact = !!currentUser && !isOwnListing;

  const onRequestContact = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!currentUser) {
      window.location.href = `/auth/sign-in?redirect=/listing/${listing.id}`;
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, message }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not send request.");
      } else {
        setRequestStatus("pending");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-4 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900">
        <ChevronLeft className="h-4 w-4" /> Back to discovery
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">{listing.title}</h1>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-ink-600">
            <MapPin className="h-3.5 w-3.5" />
            {listing.locality}, {listing.city}
            {listing.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
            {listing.k_score && (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-900">
                <Star className="h-3 w-3 fill-current" /> {(listing.k_score / 20).toFixed(1)} K-Score
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-ink-900">{formatINR(listing.rent)}</p>
          <p className="text-xs text-ink-500">per month</p>
        </div>
      </header>

      {listing.cover_image && (
        <div className="mt-6 overflow-hidden rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={listing.cover_image} alt={listing.title} className="h-[440px] w-full object-cover" />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section className="grid grid-cols-2 gap-3 rounded-3xl border border-ink-100 bg-white p-5 sm:grid-cols-4">
            <Stat label="Type" value={listing.property_type.toUpperCase()} />
            <Stat label="Bedrooms" value={listing.bhk ? `${listing.bhk} BHK` : "Room"} />
            <Stat label="Sharing" value={SHARING_LABEL[listing.sharing_type] ?? listing.sharing_type} />
            <Stat label="Furnishing" value={FURNISHING_LABEL[listing.furnished_status]} />
            <Stat label="Available" value={listing.available_from ?? "Immediately"} />
            <Stat label="Deposit" value={listing.deposit ? formatINR(listing.deposit) : "—"} />
            <Stat label="Maintenance" value={listing.maintenance ? `${formatINR(listing.maintenance)}/mo` : "Inclusive"} />
            <Stat
              label="Tenant pref"
              value={
                listing.gender_pref === "any"
                  ? "Anyone"
                  : listing.gender_pref === "couple_friendly"
                  ? "Couple friendly"
                  : listing.gender_pref
              }
            />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-900">About this home</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
              {listing.description ?? "The provider has not added a detailed description yet."}
            </p>
          </section>

          {listing.amenities && listing.amenities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-ink-900">Amenities</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {listing.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3 py-2">
                    <AmenityIcon amenity={amenity} />
                    <span className="capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-ink-900">Where you'll be</h2>
            <div className="mt-3 overflow-hidden rounded-3xl border border-ink-100">
              <iframe
                title="Map"
                width="100%"
                height="320"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${listing.lat},${listing.lng}&z=15&output=embed`}
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink-900">Provider</h2>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand">
                {listing.source_type === "direct" ? "OW" : "AG"}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-ink-900">
                  {listing.source_type === "direct" ? "Verified provider" : `Aggregated from ${listing.source_name ?? "external source"}`}
                </p>
                <p className="text-ink-500">
                  Contact details are revealed only after the provider accepts your request.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
            <p className="text-2xl font-semibold text-ink-900">
              {formatRentCompact(listing.rent)} <span className="text-sm font-normal text-ink-500">/ month</span>
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Deposit {listing.deposit ? formatINR(listing.deposit) : "to be discussed"}
            </p>

            {isOwnListing ? (
              <div className="mt-5 space-y-2">
                <Badge tone="soft">Your listing</Badge>
                <Link href={`/account/listings`} className="block">
                  <Button variant="outline" className="w-full">Manage listing</Button>
                </Link>
              </div>
            ) : revealedContact ? (
              <div className="mt-5 space-y-3 rounded-2xl bg-emerald-50 p-4 text-sm">
                <p className="font-semibold text-emerald-800">Contact unlocked</p>
                {revealedContact.name && (
                  <p className="flex items-center gap-2 text-emerald-900">
                    <UserIcon className="h-4 w-4" /> {revealedContact.name}
                  </p>
                )}
                {revealedContact.phone && (
                  <a href={`tel:${revealedContact.phone}`} className="flex items-center gap-2 text-emerald-900 underline">
                    <Phone className="h-4 w-4" /> {revealedContact.phone}
                  </a>
                )}
                {revealedContact.email && (
                  <a href={`mailto:${revealedContact.email}`} className="flex items-center gap-2 text-emerald-900 underline">
                    <Mail className="h-4 w-4" /> {revealedContact.email}
                  </a>
                )}
                <p className="text-xs text-emerald-700">
                  Please be respectful when reaching out. CalRent logs every reveal for your safety.
                </p>
              </div>
            ) : requestStatus === "pending" ? (
              <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                Request sent — waiting for the provider to accept. We will notify you and unlock contact details automatically.
              </div>
            ) : requestStatus === "declined" ? (
              <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-brand">
                The provider declined this request. Try other homes that match your criteria.
              </div>
            ) : (
              <form className="mt-5 space-y-3" onSubmit={onRequestContact}>
                <p className="inline-flex items-center gap-2 rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-700">
                  <Lock className="h-3 w-3" /> Phone & email are masked until accepted
                </p>
                <p className="text-sm text-ink-700">
                  Provider <span className="font-semibold">{maskPhone(null)}</span>
                </p>
                <p className="text-sm text-ink-700">
                  <span className="font-semibold">{maskEmail(null)}</span>
                </p>
                <Textarea
                  placeholder="Add a short note about move-in date, household and any preferences."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                />
                {error && <p className="text-sm text-brand">{error}</p>}
                {!canRequestContact ? (
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/auth/sign-in?redirect=/listing/${listing.id}`}>Sign in to request contact</Link>
                  </Button>
                ) : (
                  <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                    {submitting ? "Sending…" : "Request contact"}
                  </Button>
                )}
                <p className="text-[11px] text-ink-500">
                  By sending, you agree to CalRent's community guidelines. Misuse leads to suspension.
                </p>
              </form>
            )}
          </div>

          <div className="mt-3 rounded-3xl border border-dashed border-ink-200 bg-white p-4 text-xs text-ink-500">
            CalRent never shares phone numbers, emails, or addresses without explicit provider consent.
          </div>
        </aside>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-ink-50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value || "—"}</p>
    </div>
  );
}

function AmenityIcon({ amenity }: { amenity: string }) {
  const a = amenity.toLowerCase();
  if (a.includes("wifi")) return <Wifi className="h-4 w-4 text-ink-700" />;
  if (a.includes("park")) return <ParkingMeter className="h-4 w-4 text-ink-700" />;
  if (a.includes("ac") || a.includes("geyser")) return <Sparkles className="h-4 w-4 text-ink-700" />;
  if (a.includes("water")) return <ShowerHead className="h-4 w-4 text-ink-700" />;
  if (a.includes("avail")) return <Calendar className="h-4 w-4 text-ink-700" />;
  return <Sparkles className="h-4 w-4 text-ink-700" />;
}
