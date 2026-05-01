"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { FieldLabel } from "../ui/FieldLabel";
import { MiniMapPicker } from "../discovery/MiniMapPicker";
import { ModalShell } from "./ModalShell";
import { cn } from "../../lib/utils";

type DropSeekerPinModalProps = {
  open: boolean;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number } | null;
  onCreated?: (id: string) => void;
};

type LookingFor = "flat" | "room" | "flatmate" | "pg" | "any";
type FoodPref = "any" | "veg" | "nonveg";
type SmokingChoice = "yes" | "no" | "either";
type SelfGender = "male" | "female" | "other" | "prefer_not_to_say";
type FlatmateGender = "any" | "male" | "female" | "same_as_self" | "couple_friendly";
type MoveIn = "immediately" | "within_15_days" | "within_30_days" | "within_60_days" | "flexible";

type FormState = {
  lookingFor: LookingFor | null;
  budget: string;
  bhkPref: number | null;
  moveIn: MoveIn | null;
  flatmateFood: FoodPref | null;
  smokingOk: SmokingChoice | null;
  selfTenant: "family" | "bachelor" | null;
  selfGender: SelfGender | null;
  flatmateGenderPref: FlatmateGender | null;
  parkingRequired: boolean | null;
  lifestyleText: string;
  email: string;
  phone: string;
  location: { lat: number; lng: number } | null;
};

const initialState: FormState = {
  lookingFor: null,
  budget: "",
  bhkPref: null,
  moveIn: null,
  flatmateFood: null,
  smokingOk: null,
  selfTenant: null,
  selfGender: null,
  flatmateGenderPref: null,
  parkingRequired: null,
  lifestyleText: "",
  email: "",
  phone: "",
  location: null,
};

export function DropSeekerPinModal({
  open,
  onClose,
  initialLocation,
  onCreated,
}: DropSeekerPinModalProps) {
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
      setForm((prev) => ({ ...prev, location: initialLocation }));
    }
  }, [open, initialLocation]);

  const handleSubmit = async () => {
    setError(null);
    if (!form.lookingFor) return setError("Pick what you're looking for");
    const budget = Number(form.budget);
    if (!budget || budget <= 0) return setError("Enter a budget");
    if (!form.email) return setError("Email is required");
    if (!/^\d{10}$/.test(form.phone.trim())) return setError("Phone must be a 10-digit mobile");
    if (!form.location) return setError("Drop a pin where you want to live");

    setSubmitting(true);
    try {
      const res = await fetch("/api/seeker-pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lookingFor: form.lookingFor,
          budget,
          bhkPref: form.bhkPref,
          moveIn: form.moveIn,
          flatmateFood: form.flatmateFood,
          smokingOk: form.smokingOk === "yes" ? true : form.smokingOk === "no" ? false : null,
          selfGender: form.selfGender,
          flatmateGenderPref: form.flatmateGenderPref,
          parkingRequired: form.parkingRequired,
          lifestyleText: form.lifestyleText || null,
          email: form.email,
          phone: form.phone,
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
      title="Drop a Seeker Pin"
      subtitle="Tell us what you want — we'll ping you when a match appears."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" variant="brand" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Dropping…" : "Drop Seeker Pin"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <ChoiceGroup
          label="I'm looking for"
          required
          value={form.lookingFor}
          options={[
            { value: "flat", label: "🏢 Flat" },
            { value: "room", label: "🚪 Room" },
            { value: "flatmate", label: "👯 Flatmate" },
            { value: "pg", label: "🏠 PG" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, lookingFor: v as LookingFor }))}
        />

        <FieldLabel required>
          Budget per room (₹/month)
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500">₹</span>
            <Input
              type="number"
              min={1000}
              step={500}
              placeholder="e.g. 15000"
              value={form.budget}
              onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
              className="pl-9"
              required
            />
          </div>
        </FieldLabel>

        <ChoiceGroup
          label="BHK Preference"
          value={form.bhkPref}
          options={[1, 2, 3, 4].map((n) => ({ value: n, label: `${n} BHK` }))}
          onChange={(v) => setForm((p) => ({ ...p, bhkPref: v as number }))}
          optional
        />

        <ChoiceGroup
          label="Move-in Timeline"
          value={form.moveIn}
          options={[
            { value: "immediately", label: "Immediately" },
            { value: "within_15_days", label: "15 days" },
            { value: "within_30_days", label: "30 days" },
            { value: "within_60_days", label: "60 days" },
            { value: "flexible", label: "Flexible" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, moveIn: v as MoveIn }))}
          optional
        />

        <ChoiceGroup
          label="Food preference in flatmate"
          value={form.flatmateFood}
          options={[
            { value: "any", label: "🍽 Any" },
            { value: "veg", label: "🥗 Veg" },
            { value: "nonveg", label: "🍗 Non-veg ok" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, flatmateFood: v as FoodPref }))}
          optional
        />

        <ChoiceGroup
          label="Okay with a flatmate who smokes?"
          value={form.smokingOk}
          options={[
            { value: "yes", label: "🚬 Yes" },
            { value: "no", label: "🚭 No" },
            { value: "either", label: "🤷 Either" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, smokingOk: v as SmokingChoice }))}
          optional
        />

        <ChoiceGroup
          label="You are"
          value={form.selfTenant}
          options={[
            { value: "family", label: "👨‍👩‍👧 Family" },
            { value: "bachelor", label: "🎓 Bachelor" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, selfTenant: v as "family" | "bachelor" }))}
          optional
        />

        <ChoiceGroup
          label="Your gender"
          value={form.selfGender}
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
            { value: "prefer_not_to_say", label: "Prefer not to say" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, selfGender: v as SelfGender }))}
          optional
        />

        <ChoiceGroup
          label="What gender flatmate are you comfortable with?"
          value={form.flatmateGenderPref}
          options={[
            { value: "any", label: "Any" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "same_as_self", label: "Same as me" },
            { value: "couple_friendly", label: "Couple friendly" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, flatmateGenderPref: v as FlatmateGender }))}
          optional
        />

        <ChoiceGroup
          label="🚗 Parking required?"
          value={form.parkingRequired}
          options={[
            { value: true, label: "Yes" },
            { value: false, label: "No" },
          ]}
          onChange={(v) => setForm((p) => ({ ...p, parkingRequired: v as boolean }))}
          optional
        />

        <FieldLabel>
          Tell us about your lifestyle (optional)
          <Textarea
            rows={3}
            placeholder="e.g. I'm a night owl, work from home 3 days a week, love cooking on weekends, quiet during weekdays, can't live without my cat"
            value={form.lifestyleText}
            onChange={(e) => setForm((p) => ({ ...p, lifestyleText: e.target.value }))}
          />
          <span className="text-[11px] text-ink-500">
            Sleep pattern, cooking habits, work-from-home, pets, noise tolerance — anything that helps a potential flatmate know if you&apos;d click.
          </span>
        </FieldLabel>

        <div className="space-y-1">
          <span className="text-sm font-medium text-ink-900">
            Where do you want to live? <span className="text-brand">*</span>
          </span>
          <MiniMapPicker
            value={form.location}
            onChange={({ lat, lng }) => setForm((p) => ({ ...p, location: { lat, lng } }))}
            height={220}
            helperText="Tap on the map where you'd like to live."
            pinColor="#7c3aed"
          />
        </div>

        <FieldLabel required>
          Your email
          <Input
            type="email"
            placeholder="you@gmail.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
        </FieldLabel>

        <FieldLabel required>
          Phone number
          <Input
            type="tel"
            placeholder="10-digit mobile"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
            required
          />
          <span className="text-[11px] text-ink-500">Private — only shared when we find a match for you.</span>
        </FieldLabel>

        {error && <p className="rounded-2xl border border-brand/30 bg-brand/5 px-3 py-2 text-sm font-medium text-brand">{error}</p>}
      </div>
    </ModalShell>
  );
}

function ChoiceGroup<T extends string | number | boolean>({
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
