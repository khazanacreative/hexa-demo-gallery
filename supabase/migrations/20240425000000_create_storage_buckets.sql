
-- Create project-images bucket for storing project images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('project-images', 'Project Images', true, 5242880, '{image/*}') -- 5MB limit, only images
ON CONFLICT (id) DO NOTHING;

-- Create public policies for the project-images bucket
CREATE POLICY "Public Access to Project Images" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "Project owners can update their images" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'project-images');

CREATE POLICY "Project owners can delete their images" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'project-images');
