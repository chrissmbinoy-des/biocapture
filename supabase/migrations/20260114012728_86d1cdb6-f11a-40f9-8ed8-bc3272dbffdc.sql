-- Create function to find user_id by share ID (last 8 chars of user_id)
CREATE OR REPLACE FUNCTION public.get_user_id_by_share_id(share_id text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT user_id
  FROM species_identifications
  WHERE LOWER(RIGHT(user_id::text, 8)) = LOWER(share_id)
  LIMIT 1;
$$;