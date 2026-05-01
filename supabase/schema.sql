-- CalRent base schema (Supabase / PostgreSQL + PostGIS)
-- Enable required extensions
create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";

-- Optional enum to keep listing type constrained
do $$
begin
  if not exists (select 1 from pg_type where typname = 'listing_type') then
    create type public.listing_type as enum ('flat', 'room');
  end if;
end $$;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  source text, -- e.g. 99acres | magicbricks | facebook | direct
  source_external_id text,
  title text not null,
  description text,
  rent integer not null check (rent > 0),
  security_deposit integer check (security_deposit >= 0),
  bhk smallint check (bhk >= 0 and bhk <= 20),
  type public.listing_type not null default 'flat',
  is_verified boolean not null default false,
  geometry geography(point, 4326) not null,
  area_slug text not null, -- e.g. garia, salt-lake, new-town
  address_raw text,
  address_normalized text,
  available_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connectivity (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  metro_dist integer check (metro_dist >= 0),   -- meters
  bus_dist integer check (bus_dist >= 0),       -- meters
  grocery_dist integer check (grocery_dist >= 0), -- meters
  k_score numeric(5,2) generated always as (
    greatest(
      0,
      100
      - (coalesce(metro_dist, 2500) / 50.0)
      - (coalesce(bus_dist, 1500) / 60.0)
      - (coalesce(grocery_dist, 1200) / 70.0)
    )
  ) stored
);

create table if not exists public.restrictions (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  allow_pets boolean,
  allow_nonveg boolean,
  gender_pref text, -- any | male | female | other
  smoking boolean
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  bio text,
  lifestyle_tags text[] not null default '{}', -- vibe tags
  workplace text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- De-dup helper table for ingestion pipeline (fuzzy matching & source traceability)
create table if not exists public.ingestion_fingerprints (
  id bigserial primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  fingerprint_text text not null, -- normalized title/address/features
  fingerprint_hash text not null,
  price_band integer not null,
  created_at timestamptz not null default now()
);

-- Spatial & filtering indexes
create index if not exists idx_listings_geometry_gist on public.listings using gist (geometry);
create index if not exists idx_listings_area_slug on public.listings (area_slug);
create index if not exists idx_listings_rent on public.listings (rent);
create index if not exists idx_listings_bhk on public.listings (bhk);
create index if not exists idx_listings_type on public.listings (type);
create index if not exists idx_listings_verified on public.listings (is_verified);
create index if not exists idx_listings_search_trgm on public.listings using gin (
  coalesce(title, '') gin_trgm_ops,
  coalesce(description, '') gin_trgm_ops,
  coalesce(address_normalized, '') gin_trgm_ops
);
create index if not exists idx_ingest_fingerprint_hash on public.ingestion_fingerprints (fingerprint_hash);
create index if not exists idx_ingest_fingerprint_trgm on public.ingestion_fingerprints using gin (fingerprint_text gin_trgm_ops);

-- Auto-update timestamp helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listings_set_updated_at on public.listings;
create trigger trg_listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_profiles_set_updated_at on public.user_profiles;
create trigger trg_user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- RLS: required in Supabase public schema
alter table public.listings enable row level security;
alter table public.connectivity enable row level security;
alter table public.restrictions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.ingestion_fingerprints enable row level security;

-- Read access for marketplace browsing
drop policy if exists "public can read listings" on public.listings;
create policy "public can read listings"
on public.listings for select
using (true);

drop policy if exists "public can read connectivity" on public.connectivity;
create policy "public can read connectivity"
on public.connectivity for select
using (true);

drop policy if exists "public can read restrictions" on public.restrictions;
create policy "public can read restrictions"
on public.restrictions for select
using (true);

drop policy if exists "public can read user profiles" on public.user_profiles;
create policy "public can read user profiles"
on public.user_profiles for select
using (true);

-- Owners can manage their listings
drop policy if exists "owners can insert listings" on public.listings;
create policy "owners can insert listings"
on public.listings for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "owners can update listings" on public.listings;
create policy "owners can update listings"
on public.listings for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "owners can delete listings" on public.listings;
create policy "owners can delete listings"
on public.listings for delete
to authenticated
using (auth.uid() = owner_id);

-- Profile self-management
drop policy if exists "users can insert own profile" on public.user_profiles;
create policy "users can insert own profile"
on public.user_profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users can update own profile" on public.user_profiles;
create policy "users can update own profile"
on public.user_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
