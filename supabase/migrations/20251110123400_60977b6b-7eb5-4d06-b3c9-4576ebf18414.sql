-- Add coordinates column to species_identifications table
ALTER TABLE species_identifications ADD COLUMN coordinates jsonb;