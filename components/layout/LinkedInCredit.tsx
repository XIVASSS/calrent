"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "calrent.credit.dismissed";

export function LinkedInCredit() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const value = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    setDismissed(value === "1");
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const t = window.setTimeout(() => setOpen(true), 2000);
    return () => window.clearTimeout(t);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 print:hidden md:bottom-6 md:left-6">
      {open ? (
        <div className="flex items-center gap-3 rounded-full border border-ink-100 bg-white px-3 py-2 shadow-floating">
          <a
            href="https://www.linkedin.com/in/protyasish/?skipRedirect=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] font-medium text-ink-800 transition-colors hover:text-brand"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0A66C2] text-white">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.62-1.85 3.34-1.85 3.57 0 4.23 2.35 4.23 5.4v6.34zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.46C23.21 24 24 23.23 24 22.27V1.72C24 .77 23.21 0 22.23 0z" />
              </svg>
            </span>
            <span>
              made by <span className="font-semibold">protyasish</span>
            </span>
          </a>
          <button
            onClick={() => {
              window.localStorage.setItem(STORAGE_KEY, "1");
              setDismissed(true);
            }}
            className="grid h-6 w-6 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-700 shadow-card hover:shadow-floating"
          aria-label="About the maker"
        >
          ✨
        </button>
      )}
    </div>
  );
}
