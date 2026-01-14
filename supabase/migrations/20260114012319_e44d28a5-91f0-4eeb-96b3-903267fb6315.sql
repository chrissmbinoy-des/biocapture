-- Create function to get species count for a user (for public profiles)
CREATE OR REPLACE FUNCTION public.get_user_species_count(target_user_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::BIGINT
  FROM species_identifications
  WHERE user_id = target_user_id;
$$;

-- Create function to get unique species count for a user (for public profiles)
CREATE OR REPLACE FUNCTION public.get_user_unique_species_count(target_user_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(DISTINCT LOWER(species_name))::BIGINT
  FROM species_identifications
  WHERE user_id = target_user_id;
$$;