-- Create shop items table
CREATE TABLE public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'profile', 'badge', 'boost'
  price INTEGER NOT NULL,
  icon TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user purchases table
CREATE TABLE public.user_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID REFERENCES public.shop_items(id) ON DELETE CASCADE NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- For time-limited boosts
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Shop items are viewable by everyone
CREATE POLICY "Shop items are viewable by everyone"
ON public.shop_items
FOR SELECT
USING (true);

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.user_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert their own purchases"
ON public.user_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create time-based leaderboard functions
CREATE OR REPLACE FUNCTION public.get_worldwide_leaderboard_timeframe(
  limit_count INTEGER DEFAULT 50,
  days_back INTEGER DEFAULT NULL
)
RETURNS TABLE(user_id UUID, species_count BIGINT, rank BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    si.user_id,
    COUNT(*)::BIGINT as species_count,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::BIGINT as rank
  FROM species_identifications si
  WHERE (days_back IS NULL OR si.identified_at >= NOW() - (days_back || ' days')::INTERVAL)
  GROUP BY si.user_id
  ORDER BY species_count DESC
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_country_leaderboard_timeframe(
  country_filter TEXT,
  limit_count INTEGER DEFAULT 50,
  days_back INTEGER DEFAULT NULL
)
RETURNS TABLE(user_id UUID, species_count BIGINT, rank BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    si.user_id,
    COUNT(*)::BIGINT as species_count,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::BIGINT as rank
  FROM species_identifications si
  WHERE si.country = country_filter
    AND (days_back IS NULL OR si.identified_at >= NOW() - (days_back || ' days')::INTERVAL)
  GROUP BY si.user_id
  ORDER BY species_count DESC
  LIMIT limit_count;
$$;

-- Insert default shop items
INSERT INTO public.shop_items (name, description, category, price, icon, metadata) VALUES
-- Profile customizations
('Gold Explorer Frame', 'A prestigious golden frame for your profile', 'profile', 500, 'crown', '{"type": "frame", "style": "gold"}'),
('Nature Theme', 'Transform your profile with a lush green nature theme', 'profile', 300, 'leaf', '{"type": "theme", "style": "nature"}'),
('Ocean Theme', 'A calming blue ocean theme for your profile', 'profile', 300, 'waves', '{"type": "theme", "style": "ocean"}'),
('Master Explorer Title', 'Display the prestigious Master Explorer title', 'profile', 750, 'award', '{"type": "title", "value": "Master Explorer"}'),
('Wildlife Champion Title', 'Show off your Wildlife Champion status', 'profile', 750, 'trophy', '{"type": "title", "value": "Wildlife Champion"}'),
-- Cosmetic badges
('Golden Butterfly Badge', 'A rare golden butterfly cosmetic badge', 'badge', 400, 'butterfly', '{"rarity": "rare"}'),
('Crystal Leaf Badge', 'A beautiful crystal leaf display badge', 'badge', 350, 'leaf', '{"rarity": "uncommon"}'),
('Diamond Star Badge', 'The most exclusive diamond star badge', 'badge', 1000, 'star', '{"rarity": "legendary"}'),
('Rainbow Feather Badge', 'A vibrant rainbow feather badge', 'badge', 450, 'feather', '{"rarity": "rare"}'),
-- Boosts
('Double Coins (24h)', 'Earn double coins for the next 24 hours', 'boost', 200, 'coins', '{"type": "double_coins", "duration_hours": 24}'),
('Streak Shield', 'Protect your login streak for one missed day', 'boost', 150, 'shield', '{"type": "streak_shield", "uses": 1}'),
('Extra Daily Challenge', 'Get one additional daily challenge today', 'boost', 100, 'plus-circle', '{"type": "extra_challenge", "count": 1}');