-- Create species identifications table
CREATE TABLE public.species_identifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species_name TEXT NOT NULL,
  scientific_name TEXT,
  kingdom TEXT NOT NULL,
  confidence NUMERIC,
  description TEXT,
  image_url TEXT,
  identified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.species_identifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own identifications"
ON public.species_identifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own identifications"
ON public.species_identifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own identifications"
ON public.species_identifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_species_identifications_user_id ON public.species_identifications(user_id);
CREATE INDEX idx_species_identifications_kingdom ON public.species_identifications(kingdom);