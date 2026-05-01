"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

export function IngestRunner() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const runIngest = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ingest", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Ingestion failed");
      } else {
        setMessage(`Inserted ${json.inserted} new records (raw ${json.rawCount}, dupes ${json.duplicates}).`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {message && <span className="text-xs text-ink-500">{message}</span>}
      <Button onClick={runIngest} disabled={busy}>
        <Sparkles className="h-4 w-4" /> {busy ? "Running…" : "Run sample ingestion"}
      </Button>
    </div>
  );
}
