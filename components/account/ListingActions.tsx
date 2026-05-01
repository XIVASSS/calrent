"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

type Props = {
  listingId: string;
  status: string;
};

export function ListingActions({ listingId, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const update = async (next: "live" | "archived") => {
    setBusy(true);
    try {
      await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish_status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (status === "archived") {
    return (
      <Button onClick={() => update("live")} disabled={busy} variant="primary">
        Republish
      </Button>
    );
  }
  return (
    <Button onClick={() => update("archived")} disabled={busy} variant="outline">
      Archive
    </Button>
  );
}
