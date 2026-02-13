-- Add equipped_items column to user_profiles to persist cosmetic selections
ALTER TABLE public.user_profiles 
ADD COLUMN equipped_items jsonb DEFAULT '{}'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.user_profiles.equipped_items IS 'JSON object storing equipped cosmetic item IDs: {theme: id, frame: id, title: id, badge: id}';