-- Create update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_profiles table for extended profile data
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  country TEXT,
  display_badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "User profiles are viewable by everyone" 
ON public.user_profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create followers table
CREATE TABLE IF NOT EXISTS public.user_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

-- Public read access for follow counts
CREATE POLICY "User followers are viewable by everyone" 
ON public.user_followers 
FOR SELECT 
USING (true);

-- Users can follow/unfollow
CREATE POLICY "Users can follow others" 
ON public.user_followers 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
ON public.user_followers 
FOR DELETE 
USING (auth.uid() = follower_id);

-- Update login_streaks to be publicly readable for profile display
CREATE POLICY "Login streaks are viewable by everyone" 
ON public.login_streaks 
FOR SELECT 
USING (true);

-- Update user_badges to be publicly readable for profile display
CREATE POLICY "User badges are viewable by everyone" 
ON public.user_badges 
FOR SELECT 
USING (true);

-- Update user_purchases to be publicly readable for profile display
CREATE POLICY "User purchases are viewable by everyone" 
ON public.user_purchases 
FOR SELECT 
USING (true);

-- Create trigger for profile timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();