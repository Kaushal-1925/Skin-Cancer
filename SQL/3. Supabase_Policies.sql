-- ═════════════════════════════════════════════════════════════
-- 3. Supabase_Policies.sql
-- Run these queries in your Supabase SQL Editor to enable public
-- read/write access and resolve Row-Level Security (RLS) errors.
-- ═════════════════════════════════════════════════════════════

-- 1. Disable Row-Level Security (RLS) on the fact_lesions table
-- This allows our scraper and ETL processes to insert records freely.
ALTER TABLE fact_lesions DISABLE ROW LEVEL SECURITY;


-- 2. Ensure the 'skin-warehouse' storage bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'skin-warehouse';


-- 3. Enable Public Insert, Select, Update, and Delete on 'skin-warehouse' bucket
-- Drop policies if they already exist to avoid errors
DROP POLICY IF EXISTS "Allow Public Storage Select" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Storage Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Storage Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Storage Delete" ON storage.objects;

-- Policy to allow anyone to read images from the bucket
CREATE POLICY "Allow Public Storage Select" ON storage.objects
  FOR SELECT USING (bucket_id = 'skin-warehouse');

-- Policy to allow anyone (anonymous uploads) to insert images into the bucket
CREATE POLICY "Allow Public Storage Insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'skin-warehouse');

-- Policy to allow updates to existing files
CREATE POLICY "Allow Public Storage Update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'skin-warehouse');

-- Policy to allow deleting files
CREATE POLICY "Allow Public Storage Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'skin-warehouse');
