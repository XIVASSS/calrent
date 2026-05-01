"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { FieldLabel } from "../ui/FieldLabel";
import { MiniMapPicker } from "../discovery/MiniMapPicker";
import { ModalShell } from "./ModalShell";
import { cn } from "../../lib/utils";

type QuickAddFlatModalProps = {
  open: boolean;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number; locality?: string } | null;
  onCreated?: (id: string) => void;
};

type FurnishingChoice = "furnished" | "unfurnished";
type GatedChoice = "gated" | "not_gated";
type TenantChoice = "family" | "bachelor";
type PetChoice = "yes" | "no" | "unsure";

type FormState = {
  bhk: number | null;
  rent: string;
  furnishing: FurnishingChoice | null;
  includesMaintenance: boolean;
  gated: GatedChoice | null;
  tenant: TenantChoice | null;
  deposit: string;
  pets: PetChoice | null;
  parking: string;
  squareFeet: string;
  email: string;
  oneLiner: string;
  locality: string;
  location: { lat: number; lng: number } | null;
};

const initialState: FormState = {
  bhk: null,
  rent: "",
  furnishing: null,
  includesMaintenance: false,
  gated: null,
  tenant: null,
  deposit: "",
  pets: null,
  parking: "",
  squareFeet: "",
  email: "",
  oneLiner: "",
  locality: "",
  location: null,
};

const BHK_CHOICES = [1, 2, 3, 4, 5];

export function QuickAddFlatModal({ open, onClose, initialLocation, onCreated }: QuickAddFlatModalProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(initialState);
      setError(null);
      return;
    }
    if (initialLocation) {
      setForm((prev) => ({
        ...prev,
        location: { lat: initialLocation.lat, lng: initialLocation.lng },
        locality: prev.locality || initialLocation.locality || "",
      }));
    }
  }, [open, initialLocation]);

  const handleSubmit = async () => {
    setError(null);
    if (!form.bhk) return setError("Pick BHK count");
    const rent = Number(form.rent);
    if (!rent || rent <= 0) return setError("Enter monthly rent");
    if (!form.furnishing) return setError("Pick furnishing");
    if (!form.gated) return setError("Pick gated society");
    if (!form.location) return setError("Drop a pin on the map for location");
    const parking = Number(form.parking || "0");
    if (Number.isNaN(parking) || parking < 0) return setError("Parking must be 0 or higher");

    setSubmitting(true);
    try {
      const res = await fetch("/api/quick-add/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bhk: form.bhk,
          rent,
          furnishing: form.furnishing,
          includesMaintenance: form.includesMaintenance,
          gated: form.gated === "gated",
          tenant: form.tenant ?? "any",
          deposit: form.deposit ? Number(form.deposit) : null,
          pets: form.pets,
          parkingCount: parking,
          squareFeet: form.squareFeet ? Number(form.squareFeet) : null,
          email: form.email || null,
          oneLiner: form.oneLiner || null,
          locality: form.locality || null,
          lat: form.location.lat,
          lng: form.location.lng,
        }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) {
        setError(json.error ?? "Could not save. Try again.");
        return;
      }
      onCreated?.(json.id);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Add Your Flat"
      subtitle="Takes ~30 seconds. Pin the map and you're done."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" variant="brand" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Proceed →"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <ChoiceGroup
          label="Bedrooms (BHK)"
          required
          value={form.bhk}
          options={BHK_CHOICES.map((n) => ({
            value: n,
            label: n === 5 ? "5+" : String(n),
          }))}
          onChange={(v) => setForm((p) => ({ ...p, bhk: v as number }))}
        />

        <FieldLabel required>
          Monthly Rent (₹)
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500">₹</span>
            <Input
              type="number"
              min={1000}
              step={500}
              placeholder="e.g. 25000"
              value={form.rent}
              onChange={(e) => setForm((p) => ({ ...p, rent: e.target.value }))}
              className="pl-9"
              required
            />
          </div>
        </FieldLabel>

        <ChoiceGroup
          label="Furnishing"
          required
          value={form.furnishing}
          options={[
            { value: "furnished", label: "🛋 Furnished" },
            { value: "unfurnished", label: "📦 Unfurnished" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, furnishing: v as FurnishingChoice }))}
        />

        <ToggleRow
          label="Includes Maintenance"
          description="Is maintenance bundled in rent?"
          value={form.includesMaintenance}
          onChange={(v) => setForm((p) => ({ ...p, includesMaintenance: v }))}
        />

        <ChoiceGroup
          label="Gated Society"
          required
          value={form.gated}
          options={[
            { value: "gated", label: "🏘 Gated" },
            { value: "not_gated", label: "🚪 Not Gated" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, gated: v as GatedChoice }))}
        />

        <ChoiceGroup
          label="Who lives here?"
          value={form.tenant}
          options={[
            { value: "family", label: "👨‍👩‍👧 Family" },
            { value: "bachelor", label: "🎓 Bachelor" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, tenant: v as TenantChoice }))}
          optional
        />

        <FieldLabel>
          Deposit paid (optional)
          <Input
            type="number"
            placeholder="—"
            value={form.deposit}
            onChange={(e) => setForm((p) => ({ ...p, deposit: e.target.value }))}
          />
        </FieldLabel>

        <ChoiceGroup
          label="Pets allowed?"
          value={form.pets}
          options={[
            { value: "yes", label: "🐕 Yes" },
            { value: "no", label: "🚫 No" },
            { value: "unsure", label: "🤷 Not sure" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, pets: v as PetChoice }))}
          optional
        />

        <FieldLabel required>
          🚗 Parking for
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              placeholder="e.g. 1"
              value={form.parking}
              onChange={(e) => setForm((p) => ({ ...p, parking: e.target.value }))}
              className="max-w-[140px]"
              required
            />
            <span className="text-sm text-ink-500">cars</span>
          </div>
          <span className="text-[11px] text-ink-500">
            Enter 0 if there&apos;s no parking. 1 for one spot, 2 for two, and so on.
          </span>
        </FieldLabel>

        <FieldLabel>
          Square Footage (optional)
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={50}
              placeholder="e.g. 850"
              value={form.squareFeet}
              onChange={(e) => setForm((p) => ({ ...p, squareFeet: e.target.value }))}
              className="max-w-[180px]"
            />
            <span className="text-sm text-ink-500">sq.ft</span>
          </div>
        </FieldLabel>

        <FieldLabel>
          Locality (optional)
          <Input
            placeholder="e.g. New Town, Salt Lake, Tollygunge"
            value={form.locality}
            onChange={(e) => setForm((p) => ({ ...p, locality: e.target.value }))}
          />
        </FieldLabel>

        <div className="space-y-1">
          <span className="text-sm font-medium text-ink-900">
            Pin location <span className="text-brand">*</span>
          </span>
          <MiniMapPicker
            value={form.location}
            onChange={({ lat, lng, locality }) => {
              setForm((p) => ({
                ...p,
                location: { lat, lng },
                locality: p.locality || locality || "",
              }));
            }}
            height={220}
            helperText="Tap on the map to drop the pin or drag it to fine-tune."
          />
        </div>

        <FieldLabel>
          Your email (optional)
          <Input
            type="email"
            placeholder="e.g. you@gmail.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <span className="text-[11px] text-ink-500">Never shown publicly.</span>
        </FieldLabel>

        <FieldLabel>
          One-liner on the stay (optional)
          <Textarea
            rows={2}
            placeholder="e.g. Great locality, noisy at night"
            value={form.oneLiner}
            onChange={(e) => setForm((p) => ({ ...p, oneLiner: e.target.value }))}
          />
        </FieldLabel>

        {error && <p className="rounded-2xl border border-brand/30 bg-brand/5 px-3 py-2 text-sm font-medium text-brand">{error}</p>}
      </div>
    </ModalShell>
  );
}

function ChoiceGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
  required,
  optional,
}: {
  label: string;
  value: T | null;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink-900">
        {label}
        {required && <span className="text-brand"> *</span>}
        {optional && <span className="ml-2 text-[11px] font-normal text-ink-500">(optional)</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border-ink-900 bg-ink-900 text-white shadow-sm"
                  : "border-ink-200 bg-white text-ink-700 hover:border-ink-400"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-2xl border border-ink-200 bg-white p-3 text-left transition-colors hover:border-ink-400"
    >
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        {description && <p className="text-[11px] text-ink-500">{description}</p>}
      </div>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          value ? "bg-ink-900" : "bg-ink-300"
        )}
      >
        <span
          className={cn(
            "absolute h-4 w-4 rounded-full bg-white transition-transform",
            value ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
