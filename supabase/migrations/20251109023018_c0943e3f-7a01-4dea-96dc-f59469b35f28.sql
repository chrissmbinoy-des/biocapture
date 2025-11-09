-- Create storage bucket for species images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'species-images',
  'species-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create RLS policies for species images bucket
CREATE POLICY "Anyone can view species images"
ON storage.objects FOR SELECT
USING (bucket_id = 'species-images');

CREATE POLICY "Authenticated users can upload species images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'species-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own species images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'species-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own species images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'species-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add example_images column to species_identifications table
ALTER TABLE species_identifications
ADD COLUMN IF NOT EXISTS example_images text[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN species_identifications.example_images IS 'Array of URLs to example images of the species';