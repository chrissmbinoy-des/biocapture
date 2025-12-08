-- Create daily challenge templates table
CREATE TABLE public.daily_challenge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL, -- e.g., 'identify_species', 'identify_kingdom', 'identify_count'
  target_value text, -- e.g., kingdom name or count
  coin_reward integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user daily challenges table
CREATE TABLE public.user_daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_template_id uuid REFERENCES public.daily_challenge_templates(id) ON DELETE CASCADE,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  progress integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, challenge_template_id, challenge_date)
);

-- Create user coins table
CREATE TABLE public.user_coins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_challenge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

-- RLS policies for challenge templates (public read)
CREATE POLICY "Challenge templates are viewable by everyone"
ON public.daily_challenge_templates FOR SELECT USING (true);

-- RLS policies for user daily challenges
CREATE POLICY "Users can view their own daily challenges"
ON public.user_daily_challenges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily challenges"
ON public.user_daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily challenges"
ON public.user_daily_challenges FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for user coins
CREATE POLICY "Users can view their own coins"
ON public.user_coins FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coins record"
ON public.user_coins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coins"
ON public.user_coins FOR UPDATE USING (auth.uid() = user_id);

-- Insert challenge templates
INSERT INTO public.daily_challenge_templates (name, description, challenge_type, target_value, coin_reward) VALUES
('Plant Hunter', 'Identify 1 plant species today', 'identify_kingdom', 'plant', 15),
('Animal Spotter', 'Identify 1 mammal today', 'identify_kingdom', 'mammal', 15),
('Bug Collector', 'Identify 1 insect today', 'identify_kingdom', 'insect', 15),
('Bird Watcher', 'Identify 1 bird today', 'identify_kingdom', 'bird', 20),
('Reptile Ranger', 'Identify 1 reptile today', 'identify_kingdom', 'reptile', 25),
('Fish Finder', 'Identify 1 fish today', 'identify_kingdom', 'fish', 25),
('Amphibian Explorer', 'Identify 1 amphibian today', 'identify_kingdom', 'amphibian', 25),
('Nature Photographer', 'Identify any 2 species today', 'identify_count', '2', 20),
('Wildlife Expert', 'Identify any 3 species today', 'identify_count', '3', 30),
('Discovery Master', 'Identify any 5 species today', 'identify_count', '5', 50),
('First Light', 'Identify your first species of the day', 'identify_count', '1', 10),
('Diversity Seeker', 'Identify species from 2 different kingdoms', 'kingdom_diversity', '2', 35);