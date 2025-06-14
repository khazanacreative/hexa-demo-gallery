
-- Drop all possible existing policies individually
DROP POLICY IF EXISTS "Public can view projects" ON public.projects;
DROP POLICY IF EXISTS "Allow project creation" ON public.projects;
DROP POLICY IF EXISTS "Allow project updates" ON public.projects;
DROP POLICY IF EXISTS "Allow project deletion" ON public.projects;
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can do everything" ON public.projects;
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects or admins can update any" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects or admins can delete any" ON public.projects;

-- Ensure RLS is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "projects_select_policy"
  ON public.projects
  FOR SELECT
  USING (true);

CREATE POLICY "projects_insert_policy"
  ON public.projects
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "projects_update_policy"
  ON public.projects
  FOR UPDATE
  USING (true);

CREATE POLICY "projects_delete_policy"
  ON public.projects
  FOR DELETE
  USING (true);
