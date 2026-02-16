
-- Create weekly challenge templates table
CREATE TABLE public.weekly_challenge_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  target_value TEXT NULL,
  coin_reward INTEGER NOT NULL DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now()
);

ALTER TABLE public.weekly_challenge_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly challenge templates are viewable by everyone"
  ON public.weekly_challenge_templates FOR SELECT USING (true);

-- Create user weekly challenges table
CREATE TABLE public.user_weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_template_id UUID NULL REFERENCES public.weekly_challenge_templates(id),
  week_start DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  is_completed BOOLEAN NULL DEFAULT false,
  progress INTEGER NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now()
);

ALTER TABLE public.user_weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly challenges"
  ON public.user_weekly_challenges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly challenges"
  ON public.user_weekly_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly challenges"
  ON public.user_weekly_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Insert some weekly challenge templates
INSERT INTO public.weekly_challenge_templates (name, description, challenge_type, target_value, coin_reward) VALUES
  ('Weekly Explorer', 'Identify 10 species this week', 'weekly_total', '10', 50),
  ('Kingdom Hopper', 'Find species from 3 different kingdoms this week', 'weekly_diversity', '3', 40),
  ('Plant Week', 'Identify 5 plants this week', 'weekly_kingdom', '{"kingdom":"plant","count":5}', 35),
  ('Bird Week', 'Spot 5 different birds this week', 'weekly_kingdom', '{"kingdom":"bird","count":5}', 35),
  ('Bug Collector', 'Find 5 insects this week', 'weekly_kingdom', '{"kingdom":"insect","count":5}', 35),
  ('Daily Dedication', 'Complete 5 daily challenges this week', 'weekly_challenges', '5', 45),
  ('Streak Builder', 'Maintain a 5-day login streak', 'weekly_streak', '5', 30),
  ('Aquatic Adventure', 'Find 3 fish or amphibians this week', 'weekly_aquatic', '3', 40),
  ('Mammal Hunt', 'Identify 3 mammals this week', 'weekly_kingdom', '{"kingdom":"mammal","count":3}', 35),
  ('Nature Photographer', 'Identify 15 species this week', 'weekly_total', '15', 75);

-- Also create an RPC to get public species identifications for a user (for public profile observations)
CREATE OR REPLACE FUNCTION public.get_user_recent_identifications(target_user_id UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  species_name TEXT,
  scientific_name TEXT,
  kingdom TEXT,
  image_url TEXT,
  identified_at TIMESTAMPTZ,
  confidence NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    si.id,
    si.species_name,
    si.scientific_name,
    si.kingdom,
    si.image_url,
    si.identified_at,
    si.confidence
  FROM species_identifications si
  WHERE si.user_id = target_user_id
  ORDER BY si.identified_at DESC
  LIMIT limit_count;
$$;
