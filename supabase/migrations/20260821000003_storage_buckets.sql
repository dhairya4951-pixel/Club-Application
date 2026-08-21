-- Migration 004: Supabase Storage Buckets
-- ================================================================
-- Creates the storage buckets for profiles and activities
-- and sets up public access and upload policies.
-- ================================================================

-- Create buckets (requires the storage schema to exist, which is default in Supabase)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('activities', 'activities', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for Storage Objects (protect direct uploads)
-- Our Express backend uses the service role key so it bypasses RLS.
-- We still add standard policies for completeness.

-- 1. Profiles Bucket Policies
CREATE POLICY "Public profiles are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profiles' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profiles' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profiles' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Activities Bucket Policies
CREATE POLICY "Public activities are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'activities');

-- We don't allow authenticated users to directly upload to the activities bucket.
-- Only the backend (via service role) should handle activity image uploads
-- because we need to verify they have teacher or leadership admin rights.
