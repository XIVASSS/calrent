"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export function RespondButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"accepted" | "declined" | null>(null);

  const respond = async (decision: "accepted" | "declined") => {
    setBusy(decision);
    try {
      await fetch(`/api/contact-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Button size="sm" variant="primary" onClick={() => respond("accepted")} disabled={!!busy}>
        {busy === "accepted" ? "Accepting…" : "Accept"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => respond("declined")} disabled={!!busy}>
        {busy === "declined" ? "Declining…" : "Decline"}
      </Button>
    </>
  );
}
