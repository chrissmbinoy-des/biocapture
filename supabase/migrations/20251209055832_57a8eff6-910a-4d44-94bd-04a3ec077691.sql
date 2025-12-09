-- Add country column to species_identifications
ALTER TABLE public.species_identifications 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Create a function to get worldwide leaderboard (aggregated, no personal data exposed)
CREATE OR REPLACE FUNCTION public.get_worldwide_leaderboard(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(user_id UUID, species_count BIGINT, rank BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    si.user_id,
    COUNT(*)::BIGINT as species_count,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::BIGINT as rank
  FROM species_identifications si
  GROUP BY si.user_id
  ORDER BY species_count DESC
  LIMIT limit_count;
$$;

-- Create a function to get country-specific leaderboard
CREATE OR REPLACE FUNCTION public.get_country_leaderboard(country_filter TEXT, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(user_id UUID, species_count BIGINT, rank BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    si.user_id,
    COUNT(*)::BIGINT as species_count,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::BIGINT as rank
  FROM species_identifications si
  WHERE si.country = country_filter
  GROUP BY si.user_id
  ORDER BY species_count DESC
  LIMIT limit_count;
$$;

-- Function to get user's primary country (most identifications)
CREATE OR REPLACE FUNCTION public.get_user_country(target_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT country
  FROM species_identifications
  WHERE user_id = target_user_id AND country IS NOT NULL
  GROUP BY country
  ORDER BY COUNT(*) DESC
  LIMIT 1;
$$;