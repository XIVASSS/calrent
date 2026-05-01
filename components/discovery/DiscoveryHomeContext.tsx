"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { QuickAddFlatModal } from "../quick-add/QuickAddFlatModal";
import { DropSeekerPinModal } from "../quick-add/DropSeekerPinModal";
import { defaultFilters, type DiscoveryFilters } from "./discoveryFilters";

type QuickKind = "flat" | "seeker";
import type { ReactNode } from "react";

type DiscoveryHomeContextValue = {
  filters: DiscoveryFilters;
  setFilters: Dispatch<SetStateAction<DiscoveryFilters>>;
  listingCount: number;
  setListingCount: Dispatch<SetStateAction<number>>;
  filtersPanelOpen: boolean;
  setFiltersPanelOpen: Dispatch<SetStateAction<boolean>>;
  requestQuickAdd: (kind: QuickKind) => void;
  homeDiscoveryActive: boolean;
  setHomeDiscoveryActive: Dispatch<SetStateAction<boolean>>;
};

const DiscoveryHomeContext = createContext<DiscoveryHomeContextValue | null>(null);

export function DiscoveryHomeProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DiscoveryFilters>(defaultFilters);
  const [listingCount, setListingCount] = useState(0);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [quickKind, setQuickKind] = useState<QuickKind | null>(null);
  const [homeDiscoveryActive, setHomeDiscoveryActive] = useState(false);

  const requestQuickAdd = useCallback((kind: QuickKind) => {
    setQuickKind(kind);
  }, []);

  const value = useMemo(
    () => ({
      filters,
      setFilters,
      listingCount,
      setListingCount,
      filtersPanelOpen,
      setFiltersPanelOpen,
      requestQuickAdd,
      homeDiscoveryActive,
      setHomeDiscoveryActive,
    }),
    [filters, listingCount, filtersPanelOpen, homeDiscoveryActive, requestQuickAdd]
  );

  return (
    <DiscoveryHomeContext.Provider value={value}>
      {children}
      <QuickAddFlatModal open={quickKind === "flat"} onClose={() => setQuickKind(null)} />
      <DropSeekerPinModal open={quickKind === "seeker"} onClose={() => setQuickKind(null)} />
    </DiscoveryHomeContext.Provider>
  );
}

export function useDiscoveryHome() {
  const ctx = useContext(DiscoveryHomeContext);
  if (!ctx) throw new Error("useDiscoveryHome must be used within DiscoveryHomeProvider");
  return ctx;
}

export function useDiscoveryHomeOptional() {
  return useContext(DiscoveryHomeContext);
}
