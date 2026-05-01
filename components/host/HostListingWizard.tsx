"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { FieldLabel } from "../ui/FieldLabel";
import { getSupabaseBrowser } from "../../lib/supabase/browser";
import { guessKolkataCoordinate, slugifyLocality } from "../../lib/listings/geocode";
import { cn } from "../../lib/utils";
import { MiniMapPicker } from "../discovery/MiniMapPicker";

const DEFAULT_AMENITIES = [
  "wifi",
  "ac",
  "geyser",
  "lift",
  "parking",
  "24x7 water",
  "power backup",
  "gym",
  "swimming pool",
  "clubhouse",
  "meals included",
  "laundry",
  "24x7 security",
  "pet friendly",
];

type Profile = { id: string; full_name: string; phone: string; email: string };

type Draft = {
  title: string;
  description: string;
  property_type: "flat" | "room" | "pg" | "studio";
  bhk: number | null;
  rooms_count: number | null;
  sharing_type: "single" | "double" | "triple" | "private_room" | "whole";
  occupancy_max: number | null;
  rent: number;
  deposit: number | null;
  maintenance: number | null;
  furnished_status: "furnished" | "semi_furnished" | "unfurnished";
  available_from: string | null;
  locality: string;
  area_slug: string;
  city: string;
  lat: number;
  lng: number;
  gender_pref: "any" | "male" | "female" | "couple_friendly";
  amenities: string[];
  cover_image: string | null;
  source_contact_name: string;
  source_contact_phone: string;
  source_contact_email: string | null;
};

const STEPS = [
  { id: "basics", label: "Basics" },
  { id: "details", label: "Details" },
  { id: "photos", label: "Photos" },
  { id: "review", label: "Review" },
];

export function HostListingWizard({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    title: "",
    description: "",
    property_type: "flat",
    bhk: 2,
    rooms_count: 2,
    sharing_type: "whole",
    occupancy_max: 4,
    rent: 18000,
    deposit: 36000,
    maintenance: 0,
    furnished_status: "semi_furnished",
    available_from: null,
    locality: "",
    area_slug: "",
    city: "Kolkata",
    lat: 22.5726,
    lng: 88.3639,
    gender_pref: "any",
    amenities: [],
    cover_image: null,
    source_contact_name: profile.full_name,
    source_contact_phone: profile.phone,
    source_contact_email: profile.email,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const onAutoLocate = () => {
    const guess = guessKolkataCoordinate(`${draft.locality} ${draft.title} ${draft.description}`);
    if (guess) {
      update({ lat: guess.lat, lng: guess.lng });
    }
  };

  const onLocalityChange = (value: string) => {
    update({ locality: value, area_slug: slugifyLocality(value) });
  };

  const onUploadCover = async (file: File) => {
    setCoverUploading(true);
    setError(null);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError("Supabase is not configured.");
      setCoverUploading(false);
      return;
    }
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("listing-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (uploadError) {
      setError(uploadError.message);
      setCoverUploading(false);
      return;
    }
    const { data: publicUrl } = supabase.storage.from("listing-images").getPublicUrl(path);
    update({ cover_image: publicUrl.publicUrl });
    setCoverUploading(false);
  };

  const validateStep = () => {
    if (step === 0) {
      if (draft.title.length < 8) return "Title must be at least 8 characters";
      if (draft.locality.length < 2) return "Locality is required";
      if (!draft.lat || !draft.lng) return "Please pick a map location";
    }
    if (step === 1) {
      if (draft.description.length < 40) return "Description should be at least 40 characters";
      if (draft.rent < 1500) return "Rent must be at least ₹1,500";
    }
    return null;
  };

  const handleNext = () => {
    const issue = validateStep();
    if (issue) {
      setError(issue);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }
      router.push(`/listing/${json.id}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex justify-between text-xs font-medium uppercase tracking-wide text-ink-500">
          {STEPS.map((s, idx) => (
            <span key={s.id} className={cn(idx <= step && "text-ink-900")}>{s.label}</span>
          ))}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-ink-900 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
        {step === 0 && (
          <BasicsStep draft={draft} update={update} onLocalityChange={onLocalityChange} onAutoLocate={onAutoLocate} />
        )}
        {step === 1 && <DetailsStep draft={draft} update={update} />}
        {step === 2 && (
          <PhotosStep
            draft={draft}
            update={update}
            onUploadCover={onUploadCover}
            uploading={coverUploading}
          />
        )}
        {step === 3 && <ReviewStep draft={draft} />}
        {error && <p className="mt-4 text-sm text-brand">{error}</p>}
        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} size="lg">
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} size="lg" disabled={submitting}>
              {submitting ? "Publishing…" : "Publish listing"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function BasicsStep({
  draft,
  update,
  onLocalityChange,
  onAutoLocate,
}: {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  onLocalityChange: (value: string) => void;
  onAutoLocate: () => void;
}) {
  return (
    <div className="grid gap-5">
      <FieldLabel required>
        Title
        <Input
          value={draft.title}
          onChange={(event) => update({ title: event.target.value })}
          placeholder="Bright 2BHK in South City near Metro"
          required
        />
      </FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel required>
          Locality / Area
          <Input
            value={draft.locality}
            onChange={(event) => onLocalityChange(event.target.value)}
            placeholder="South City, Salt Lake, New Town…"
            required
          />
        </FieldLabel>
        <FieldLabel hint="Slug auto-generated">
          Area slug
          <Input
            value={draft.area_slug}
            onChange={(event) => update({ area_slug: event.target.value })}
            placeholder="south-city"
          />
        </FieldLabel>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldLabel>
          Property type
          <select
            className="h-11 rounded-xl border border-ink-200 px-3"
            value={draft.property_type}
            onChange={(event) => update({ property_type: event.target.value as Draft["property_type"] })}
          >
            <option value="flat">Flat</option>
            <option value="studio">Studio</option>
            <option value="room">Room (in shared flat)</option>
            <option value="pg">PG</option>
          </select>
        </FieldLabel>
        <FieldLabel>
          BHK
          <Input
            type="number"
            min={1}
            max={8}
            value={draft.bhk ?? ""}
            onChange={(event) =>
              update({ bhk: event.target.value ? Number(event.target.value) : null })
            }
          />
        </FieldLabel>
        <FieldLabel>
          Sharing
          <select
            className="h-11 rounded-xl border border-ink-200 px-3"
            value={draft.sharing_type}
            onChange={(event) => update({ sharing_type: event.target.value as Draft["sharing_type"] })}
          >
            <option value="whole">Entire home</option>
            <option value="private_room">Private room</option>
            <option value="single">Single sharing</option>
            <option value="double">Double sharing</option>
            <option value="triple">Triple sharing</option>
          </select>
        </FieldLabel>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-900">
            Pin location <span className="text-brand">*</span>
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={onAutoLocate}>
            <MapPin className="h-3.5 w-3.5" /> Auto-locate from locality
          </Button>
        </div>
        <MiniMapPicker
          value={{ lat: draft.lat, lng: draft.lng }}
          onChange={({ lat, lng, locality }) => {
            update({ lat, lng });
            if (locality && !draft.locality) {
              update({ locality, area_slug: slugifyLocality(locality) });
            }
          }}
          height={280}
          helperText="Click anywhere on the map to drop the pin or drag it for fine-tuning."
        />
        <p className="font-mono text-[11px] text-ink-500">
          {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
        </p>
      </div>
    </div>
  );
}

function DetailsStep({ draft, update }: { draft: Draft; update: (patch: Partial<Draft>) => void }) {
  return (
    <div className="grid gap-5">
      <FieldLabel required>
        Description
        <Textarea
          value={draft.description}
          onChange={(event) => update({ description: event.target.value })}
          placeholder="Tell renters about the home, the locality, transit, society and any house rules."
          rows={6}
          required
        />
      </FieldLabel>
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldLabel required>
          Monthly rent ₹
          <Input
            type="number"
            min={1500}
            value={draft.rent}
            onChange={(event) => update({ rent: Number(event.target.value) })}
            required
          />
        </FieldLabel>
        <FieldLabel>
          Security deposit ₹
          <Input
            type="number"
            value={draft.deposit ?? ""}
            onChange={(event) =>
              update({ deposit: event.target.value ? Number(event.target.value) : null })
            }
          />
        </FieldLabel>
        <FieldLabel>
          Maintenance ₹/mo
          <Input
            type="number"
            value={draft.maintenance ?? ""}
            onChange={(event) =>
              update({ maintenance: event.target.value ? Number(event.target.value) : null })
            }
          />
        </FieldLabel>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldLabel>
          Furnishing
          <select
            className="h-11 rounded-xl border border-ink-200 px-3"
            value={draft.furnished_status}
            onChange={(event) =>
              update({ furnished_status: event.target.value as Draft["furnished_status"] })
            }
          >
            <option value="furnished">Furnished</option>
            <option value="semi_furnished">Semi-furnished</option>
            <option value="unfurnished">Unfurnished</option>
          </select>
        </FieldLabel>
        <FieldLabel>
          Tenant preference
          <select
            className="h-11 rounded-xl border border-ink-200 px-3"
            value={draft.gender_pref}
            onChange={(event) => update({ gender_pref: event.target.value as Draft["gender_pref"] })}
          >
            <option value="any">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="couple_friendly">Couple friendly</option>
          </select>
        </FieldLabel>
        <FieldLabel>
          Available from
          <Input
            type="date"
            value={draft.available_from ?? ""}
            onChange={(event) => update({ available_from: event.target.value || null })}
          />
        </FieldLabel>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink-900">Amenities</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEFAULT_AMENITIES.map((amenity) => {
            const active = draft.amenities.includes(amenity);
            return (
              <button
                type="button"
                key={amenity}
                onClick={() => {
                  update({
                    amenities: active
                      ? draft.amenities.filter((a) => a !== amenity)
                      : [...draft.amenities, amenity],
                  });
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  active
                    ? "border-ink-900 bg-ink-900 text-white"
                    : "border-ink-200 bg-white text-ink-700 hover:border-ink-900"
                )}
              >
                {amenity}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhotosStep({
  draft,
  update,
  onUploadCover,
  uploading,
}: {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  onUploadCover: (file: File) => Promise<void>;
  uploading: boolean;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-500">
        Add a clear, well-lit photo of the home's main view. We'll show it as the cover image. You can add more photos after publishing.
      </p>
      <div>
        {draft.cover_image ? (
          <div className="relative overflow-hidden rounded-2xl border border-ink-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.cover_image} alt="Cover" className="h-72 w-full object-cover" />
            <button
              className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-900 shadow-sm hover:bg-ink-50"
              onClick={() => update({ cover_image: null })}
              type="button"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex h-72 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-white text-sm text-ink-500 hover:border-ink-900">
            <Camera className="h-6 w-6" />
            {uploading ? "Uploading…" : "Click to upload cover photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUploadCover(file);
              }}
            />
          </label>
        )}
      </div>

      <FieldLabel>
        External cover URL (optional)
        <Input
          type="url"
          value={draft.cover_image ?? ""}
          onChange={(event) => update({ cover_image: event.target.value || null })}
          placeholder="https://"
        />
      </FieldLabel>
    </div>
  );
}

function ReviewStep({ draft }: { draft: Draft }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-ink-50 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-ink-900">
          <Sparkles className="h-4 w-4" /> Final review
        </p>
        <p className="mt-2 text-ink-600">
          Your listing will go live immediately. Renters will see masked contact details and can request access. You will get a notification on every request.
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" value={draft.title} />
        <Field label="Locality" value={draft.locality} />
        <Field label="Property type" value={draft.property_type} />
        <Field label="Bedrooms" value={draft.bhk ?? "—"} />
        <Field label="Sharing" value={draft.sharing_type} />
        <Field label="Furnishing" value={draft.furnished_status} />
        <Field label="Rent" value={`₹${draft.rent}`} />
        <Field label="Deposit" value={draft.deposit ? `₹${draft.deposit}` : "—"} />
        <Field label="Tenant pref" value={draft.gender_pref} />
        <Field label="Amenities" value={draft.amenities.join(", ") || "None"} />
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-ink-100 p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink-900">{value || "—"}</p>
    </div>
  );
}
