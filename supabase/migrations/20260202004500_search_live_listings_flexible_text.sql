-- Multi-token discovery search: each token with length >= 2 must appear as a substring
-- (case-insensitive). Example: "sector v" matches rows containing "Salt Lake Sector V"
-- because token "sector" matches; single-letter tokens are skipped unless none qualify,
-- then the whole trimmed phrase is matched as today.
--
-- Preserves search_live_listings signature + RETURNS TABLE shape expected by PostgREST.

CREATE OR REPLACE FUNCTION public.listing_search_token_match(haystack text, search_raw text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SECURITY INVOKER
SET search_path TO 'public'
AS $match$
DECLARE
  raw text := trim(lower(search_raw));
  norm text;
  tok text;
  found_long boolean := false;
BEGIN
  IF raw IS NULL OR raw = '' THEN
    RETURN true;
  END IF;

  norm := regexp_replace(lower(coalesce(haystack, '')), '\s+', ' ', 'g');

  FOR tok IN SELECT trim(x) FROM regexp_split_to_table(raw, '\s+') AS x
  LOOP
    IF length(tok) >= 2 THEN
      found_long := true;
      IF position(tok IN norm) = 0 THEN
        RETURN false;
      END IF;
    END IF;
  END LOOP;

  IF found_long THEN
    RETURN true;
  END IF;

  RETURN position(raw IN norm) > 0;
END;
$match$;

CREATE OR REPLACE FUNCTION public.search_live_listings(
  p_min_lat double precision,
  p_min_lng double precision,
  p_max_lat double precision,
  p_max_lng double precision,
  p_min_rent integer DEFAULT NULL::integer,
  p_max_rent integer DEFAULT NULL::integer,
  p_bhk smallint[] DEFAULT NULL::smallint[],
  p_sharing sharing_type[] DEFAULT NULL::sharing_type[],
  p_furnishing furnishing_status[] DEFAULT NULL::furnishing_status[],
  p_gender gender_pref DEFAULT NULL::gender_pref,
  p_no_broker boolean DEFAULT NULL::boolean,
  p_query text DEFAULT NULL::text,
  p_limit integer DEFAULT 200
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  property_type property_type,
  bhk smallint,
  rooms_count smallint,
  sharing_type sharing_type,
  rent integer,
  deposit integer,
  furnished_status furnishing_status,
  available_from date,
  locality text,
  area_slug text,
  city text,
  lat double precision,
  lng double precision,
  gender_pref gender_pref,
  amenities text[],
  source_type source_type,
  source_name text,
  is_verified boolean,
  k_score smallint,
  cover_image text,
  gated_society boolean,
  square_feet integer,
  parking_count smallint,
  pet_policy text,
  tenant_type text,
  includes_maintenance boolean,
  food_pref text,
  one_liner text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  lim integer := greatest(1, least(coalesce(nullif(p_limit, 0), 200), 500));
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.description,
    l.property_type,
    l.bhk,
    l.rooms_count,
    l.sharing_type,
    l.rent,
    l.deposit,
    l.furnished_status,
    l.available_from,
    l.locality,
    l.area_slug,
    l.city,
    l.lat,
    l.lng,
    l.gender_pref,
    l.amenities,
    l.source_type,
    l.source_name,
    l.is_verified,
    l.k_score,
    l.cover_image,
    l.gated_society,
    l.square_feet,
    l.parking_count,
    l.pet_policy,
    l.tenant_type,
    l.includes_maintenance,
    l.food_pref,
    l.one_liner,
    l.created_at
  FROM public.listings l
  WHERE l.publish_status = 'live'
    AND l.lat BETWEEN p_min_lat AND p_max_lat
    AND l.lng BETWEEN p_min_lng AND p_max_lng
    AND (p_min_rent IS NULL OR l.rent >= p_min_rent)
    AND (p_max_rent IS NULL OR l.rent <= p_max_rent)
    AND (
      p_bhk IS NULL
      OR (l.bhk IS NOT NULL AND l.bhk = ANY (p_bhk))
      OR (4::smallint = ANY (p_bhk) AND COALESCE(l.bhk, 0::smallint) >= 4)
    )
    AND (p_sharing IS NULL OR l.sharing_type = ANY (p_sharing))
    AND (p_furnishing IS NULL OR l.furnished_status = ANY (p_furnishing))
    AND (
      p_gender IS NULL
      OR l.gender_pref = p_gender
      OR l.gender_pref = 'any'::gender_pref
    )
    AND (
      p_no_broker IS NULL
      OR NOT p_no_broker
      OR l.source_type = 'direct'::source_type
    )
    AND (
      p_query IS NULL
      OR trim(p_query) = ''
      OR public.listing_search_token_match(
          concat_ws(
            ' ',
            coalesce(l.title, ''),
            coalesce(l.locality, ''),
            coalesce(replace(l.area_slug, '-', ' '), ''),
            coalesce(l.city, ''),
            coalesce(l.description, ''),
            coalesce(l.one_liner, ''),
            coalesce(array_to_string(l.amenities, ' '), ''),
            coalesce(l.source_name, ''),
            coalesce(l.property_type::text, '')
          ),
          p_query
        )
    )
  ORDER BY l.is_verified DESC, l.k_score DESC NULLS LAST, l.created_at DESC
  LIMIT lim;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.listing_search_token_match(text, text) TO anon, authenticated;
