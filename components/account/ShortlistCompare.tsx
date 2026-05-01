"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import type { PublicListing } from "../../lib/supabase/types";
import { formatINR, formatRentCompact } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

type Props = { listings: PublicListing[] };

const FIELDS: { key: keyof PublicListing | string; label: string; render: (l: PublicListing) => string }[] = [
  { key: "rent", label: "Monthly rent", render: (l) => formatRentCompact(l.rent) },
  { key: "deposit", label: "Deposit", render: (l) => (l.deposit ? formatINR(l.deposit) : "—") },
  { key: "bhk", label: "BHK", render: (l) => (l.bhk ? `${l.bhk} BHK` : "Room") },
  { key: "sharing_type", label: "Sharing", render: (l) => l.sharing_type },
  { key: "furnished_status", label: "Furnishing", render: (l) => l.furnished_status },
  { key: "gender_pref", label: "Tenant pref", render: (l) => l.gender_pref },
  { key: "k_score", label: "K-Score", render: (l) => `${l.k_score ?? "—"} / 100` },
  { key: "amenities", label: "Amenities", render: (l) => (l.amenities ?? []).slice(0, 4).join(", ") || "—" },
  { key: "source_type", label: "Source", render: (l) => (l.source_type === "direct" ? "Direct" : `${l.source_name ?? "Aggregated"}`) },
  { key: "is_verified", label: "Verified", render: (l) => (l.is_verified ? "Yes" : "Pending") },
];

export function ShortlistCompare({ listings: initial }: Props) {
  const [items, setItems] = useState(initial);

  const remove = async (id: string) => {
    setItems((curr) => curr.filter((x) => x.id !== id));
    await fetch("/api/shortlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, action: "remove" }),
    });
  };

  const cheapest = useMemo(() => Math.min(...items.map((l) => l.rent)), [items]);
  const bestK = useMemo(() => Math.max(...items.map((l) => l.k_score ?? 0)), [items]);

  return (
    <div className="overflow-x-auto rounded-3xl border border-ink-100 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
            <th className="w-40 px-4 py-3">Compare</th>
            {items.map((listing) => (
              <th key={listing.id} className="px-4 py-3 align-top">
                <div className="flex items-start gap-2">
                  <div className="h-12 w-16 overflow-hidden rounded-xl bg-ink-100">
                    {listing.cover_image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.cover_image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/listing/${listing.id}`} className="line-clamp-1 text-sm font-semibold text-ink-900 hover:underline">
                      {listing.title}
                    </Link>
                    <p className="text-xs text-ink-500">{listing.locality}</p>
                    <button
                      onClick={() => remove(listing.id)}
                      className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-brand"
                    >
                      <Trash2 className="h-3 w-3" /> remove
                    </button>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FIELDS.map((field) => (
            <tr key={field.key as string} className="border-t border-ink-100">
              <td className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-500">{field.label}</td>
              {items.map((listing) => {
                const isMin = field.key === "rent" && listing.rent === cheapest;
                const isBestK = field.key === "k_score" && (listing.k_score ?? 0) === bestK;
                return (
                  <td key={listing.id} className="px-4 py-3 align-top text-ink-800">
                    <span className={isMin || isBestK ? "font-semibold text-ink-900" : ""}>{field.render(listing)}</span>
                    {isMin && <Badge tone="verified" className="ml-2">Cheapest</Badge>}
                    {isBestK && <Badge tone="metro" className="ml-2">Best metro</Badge>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
