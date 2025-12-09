-- Create login_streaks table to track user login streaks
CREATE TABLE public.login_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_login_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own streak"
ON public.login_streaks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
ON public.login_streaks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
ON public.login_streaks
FOR UPDATE
USING (auth.uid() = user_id);

-- Create streak_rewards table for milestone rewards
CREATE TABLE public.streak_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  streak_days integer NOT NULL,
  coin_reward integer NOT NULL DEFAULT 10,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS with public read
ALTER TABLE public.streak_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streak rewards are viewable by everyone"
ON public.streak_rewards
FOR SELECT
USING (true);

-- Insert default streak rewards
INSERT INTO public.streak_rewards (streak_days, coin_reward, description) VALUES
(3, 10, '3-Day Streak'),
(7, 25, 'Weekly Warrior'),
(14, 50, 'Two Week Champion'),
(30, 100, 'Monthly Master'),
(60, 200, 'Double Month Hero'),
(100, 500, 'Century Club');