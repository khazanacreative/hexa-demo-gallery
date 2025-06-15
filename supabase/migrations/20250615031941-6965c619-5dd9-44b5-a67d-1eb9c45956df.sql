
-- Insert missing users that are referenced in existing projects
INSERT INTO public.users (id, name, email, role) 
VALUES (
  'c07e6ba2-a252-4f7c-a0f8-0ac7dbe433d5'::uuid,
  'Admin User Local',
  'admin@local.com',
  'admin'
) 
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

INSERT INTO public.users (id, name, email, role) 
VALUES (
  'ef13c84c-195d-44ca-bf4a-8166500f1b3c'::uuid,
  'User Local',
  'user@local.com',
  'user'
) 
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Now fix the handle_updated_at function to have immutable search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create or replace the trigger for projects table
DROP TRIGGER IF EXISTS handle_updated_at ON public.projects;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Ensure the projects table has proper foreign key constraint to users table
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
