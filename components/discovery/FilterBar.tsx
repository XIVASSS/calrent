"use client";

import { Filter, MapPin, X } from "lucide-react";
import { cn, formatRentCompact } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useDiscoveryHome } from "./DiscoveryHomeContext";
import { defaultFilters, type DiscoveryFilters } from "./discoveryFilters";

export type { DiscoveryFilters } from "./discoveryFilters";
export { defaultFilters } from "./discoveryFilters";

const BHK_OPTIONS = [
  { value: 1, label: "1 BHK" },
  { value: 2, label: "2 BHK" },
  { value: 3, label: "3 BHK" },
  { value: 4, label: "4+ BHK" },
];

const SHARING_OPTIONS = [
  { value: "whole", label: "Entire home" },
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "triple", label: "Triple" },
  { value: "private_room", label: "Private room" },
];

const FURNISHING_OPTIONS = [
  { value: "furnished", label: "Furnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

type FilterBarProps = {
  filters: DiscoveryFilters;
  onChange: (next: DiscoveryFilters) => void;
  totalCount: number;
};

export function FilterBar({ filters, onChange, totalCount }: FilterBarProps) {
  const { filtersPanelOpen, setFiltersPanelOpen } = useDiscoveryHome();

  const toggleArray = <T extends string | number>(value: T, list: T[]): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const q = filters.query.trim();
  const queryChip =
    q.length > 0 ? `Search: ${q.length > 28 ? `${q.slice(0, 28)}…` : q}` : null;

  const activeChips = [
    queryChip,
    filters.bhk.length > 0 ? `${filters.bhk.length} BHK` : null,
    filters.sharing.length > 0 ? `${filters.sharing.length} sharing` : null,
    filters.maxRent ? `Up to ${formatRentCompact(filters.maxRent)}` : null,
    filters.gender ? filters.gender : null,
    filters.noBroker ? "No broker" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 min-w-[200px] text-sm text-ink-600">
          Refine results with <span className="font-medium text-ink-800">Filters</span> — search is in the bar
          above.
        </p>
        <Button
          variant="outline"
          size="md"
          className="!rounded-full shrink-0"
          onClick={() => setFiltersPanelOpen((v) => !v)}
        >
          <Filter className="h-4 w-4" /> Filters
          {activeChips.length > 0 && (
            <span className="ml-1 inline-grid min-h-5 min-w-5 place-items-center rounded-full bg-ink-900 px-1.5 text-[11px] text-white">
              {activeChips.length}
            </span>
          )}
        </Button>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip, i) => (
            <span
              key={`${chip}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700"
            >
              {chip}
            </span>
          ))}
          <button
            onClick={() => onChange(defaultFilters)}
            className="text-xs font-medium text-ink-500 underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {filtersPanelOpen && (
        <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Refine your search</p>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setFiltersPanelOpen(false)}
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FilterGroup label="Bedrooms">
              {BHK_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  active={filters.bhk.includes(option.value)}
                  onClick={() => onChange({ ...filters, bhk: toggleArray(option.value, filters.bhk) })}
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Sharing">
              {SHARING_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  active={filters.sharing.includes(option.value)}
                  onClick={() =>
                    onChange({ ...filters, sharing: toggleArray(option.value, filters.sharing) })
                  }
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Furnishing">
              {FURNISHING_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  active={filters.furnishing.includes(option.value)}
                  onClick={() =>
                    onChange({
                      ...filters,
                      furnishing: toggleArray(option.value, filters.furnishing),
                    })
                  }
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Tenant gender">
              {(["any", "male", "female", "couple_friendly"] as const).map((value) => (
                <Chip
                  key={value}
                  label={value === "couple_friendly" ? "Couple friendly" : value}
                  active={filters.gender === value}
                  onClick={() =>
                    onChange({ ...filters, gender: filters.gender === value ? null : value })
                  }
                />
              ))}
            </FilterGroup>

            <div className="md:col-span-2">
              <FilterGroup label="Monthly rent">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    type="number"
                    placeholder="Min ₹"
                    value={filters.minRent ?? ""}
                    onChange={(event) =>
                      onChange({
                        ...filters,
                        minRent: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                    className="w-32"
                  />
                  <span className="text-ink-400">to</span>
                  <Input
                    type="number"
                    placeholder="Max ₹"
                    value={filters.maxRent ?? ""}
                    onChange={(event) =>
                      onChange({
                        ...filters,
                        maxRent: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                    className="w-32"
                  />
                  <Chip
                    label="No broker"
                    active={filters.noBroker}
                    onClick={() => onChange({ ...filters, noBroker: !filters.noBroker })}
                  />
                </div>
              </FilterGroup>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
            <button
              onClick={() => onChange(defaultFilters)}
              className="text-sm font-medium text-ink-600 underline-offset-4 hover:underline"
            >
              Clear all
            </button>
            <Button onClick={() => setFiltersPanelOpen(false)}>Show {totalCount} homes</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
        active
          ? "border-ink-900 bg-ink-900 text-white"
          : "border-ink-200 bg-white text-ink-700 hover:border-ink-900"
      )}
    >
      {label}
    </button>
  );
}

export function LocaleHint() {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-700">
      <MapPin className="h-3 w-3" /> Showing homes in this map view
    </div>
  );
}
