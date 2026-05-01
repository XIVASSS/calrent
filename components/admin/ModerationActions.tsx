"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";

export function ModerationActions({ recordId }: { recordId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const respond = async (decision: "approve" | "reject" | "needs_changes") => {
    setBusy(decision);
    try {
      await fetch(`/api/admin/moderation/${recordId}`, {
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
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="primary" onClick={() => respond("approve")} disabled={!!busy}>
        {busy === "approve" ? "Approving…" : "Approve & publish"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => respond("needs_changes")} disabled={!!busy}>
        Needs changes
      </Button>
      <Button size="sm" variant="ghost" onClick={() => respond("reject")} disabled={!!busy}>
        Reject
      </Button>
    </div>
  );
}
