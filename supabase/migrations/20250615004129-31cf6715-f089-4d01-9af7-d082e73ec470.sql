
-- Create the project-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images', 
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can upload to project-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view project-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update project-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete project-images" ON storage.objects;

-- Create permissive RLS policies for project-images bucket
CREATE POLICY "Anyone can upload to project-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Anyone can view project-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-images');

CREATE POLICY "Anyone can update project-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-images');

CREATE POLICY "Anyone can delete project-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-images');
