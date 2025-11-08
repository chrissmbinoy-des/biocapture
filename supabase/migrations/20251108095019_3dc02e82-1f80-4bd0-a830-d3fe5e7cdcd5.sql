-- Create badges table to define available badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL, -- 'first_species', 'kingdom_count', 'total_count', 'single_rare'
  requirement_value text, -- JSON data for requirement details
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_badges table to track earned badges
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for badges (public read)
CREATE POLICY "Badges are viewable by everyone"
ON public.badges
FOR SELECT
USING (true);

-- Policies for user_badges
CREATE POLICY "Users can view their own badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
ON public.user_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, requirement_type, requirement_value) VALUES
('First Discovery', 'Identified your first species', '🌟', 'total_count', '1'),
('Plant Expert', 'Identified your first plant', '🌿', 'kingdom_count', '{"kingdom": "plant", "count": 1}'),
('Animal Lover', 'Identified your first mammal', '🦁', 'kingdom_count', '{"kingdom": "mammal", "count": 1}'),
('Bird Watcher', 'Identified your first bird', '🦅', 'kingdom_count', '{"kingdom": "bird", "count": 1}'),
('Bug Hunter', 'Identified your first insect', '🦋', 'kingdom_count', '{"kingdom": "insect", "count": 1}'),
('Reptile Tracker', 'Identified your first reptile', '🦎', 'kingdom_count', '{"kingdom": "reptile", "count": 1}'),
('Fish Finder', 'Identified your first fish', '🐟', 'kingdom_count', '{"kingdom": "fish", "count": 1}'),
('Amphibian Scout', 'Identified your first amphibian', '🐸', 'kingdom_count', '{"kingdom": "amphibian", "count": 1}'),
('Collector', 'Reached 10 species', '🏆', 'total_count', '10'),
('Naturalist', 'Reached 25 species', '🎖️', 'total_count', '25'),
('Expert', 'Reached 50 species', '👑', 'total_count', '50'),
('Master', 'Reached 100 species', '💎', 'total_count', '100'),
('Rare Find', 'Found a single occurrence species', '✨', 'single_rare', '1');