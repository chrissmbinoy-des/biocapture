CREATE OR REPLACE FUNCTION public.get_user_id_by_share_id(share_id text)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT user_id FROM (
    SELECT DISTINCT user_id
    FROM user_profiles
    WHERE LOWER(RIGHT(user_id::text, 8)) = LOWER(share_id)
    UNION
    SELECT DISTINCT user_id
    FROM species_identifications
    WHERE LOWER(RIGHT(user_id::text, 8)) = LOWER(share_id)
  ) combined
  LIMIT 1;
$$;