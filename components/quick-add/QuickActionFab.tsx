"use client";

import { useState } from "react";
import { Home, MapPinned, Plus } from "lucide-react";
import { useDiscoveryHome } from "../discovery/DiscoveryHomeContext";

type QuickActionFabProps = {
  onCreated?: () => void;
};

export function QuickActionFab(_props: QuickActionFabProps) {
  const { requestQuickAdd } = useDiscoveryHome();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2 print:hidden md:bottom-6 md:right-6">
      {open && (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              requestQuickAdd("flat");
            }}
            className="flex max-w-[min(100vw-2rem,280px)] flex-col gap-0.5 rounded-2xl bg-ink-900 px-4 py-3 text-left text-sm font-medium text-white shadow-card hover:shadow-floating"
          >
            <span className="flex items-center gap-2">
              <Home className="h-4 w-4 shrink-0" /> List your flat
            </span>
            <span className="text-xs font-normal text-white/75">
              Quick form · photos · pin on map
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              requestQuickAdd("seeker");
            }}
            className="flex max-w-[min(100vw-2rem,280px)] flex-col gap-0.5 rounded-2xl bg-brand px-4 py-3 text-left text-sm font-medium text-white shadow-card hover:shadow-floating"
          >
            <span className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 shrink-0" /> Drop a seeker pin
            </span>
            <span className="text-xs font-normal text-white/90">
              Budget & prefs · landlords can notice you on the map
            </span>
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-14 w-14 place-items-center rounded-full bg-ink-900 text-white shadow-floating transition-transform hover:scale-105"
        aria-expanded={open}
        aria-label="Post a listing or mark where you are looking"
      >
        {open ? <Plus className="h-6 w-6 rotate-45 transition-transform" /> : <MapPinned className="h-6 w-6" />}
      </button>
    </div>
  );
}
