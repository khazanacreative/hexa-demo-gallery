
-- Add admin policies to allow admin role to manage all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can insert any project"
  ON projects FOR INSERT
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update any project"
  ON projects FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete any project"
  ON projects FOR DELETE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Add storage bucket policies for project images
CREATE POLICY "Anyone can view project images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can update any images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-images' AND 
        ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() = owner));

CREATE POLICY "Admins can delete any images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-images' AND 
        ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() = owner));
