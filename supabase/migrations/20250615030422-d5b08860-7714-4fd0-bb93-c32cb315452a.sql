
-- Create users table to match the foreign key constraint
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert the default admin user that matches the local auth
INSERT INTO public.users (id, name, email, role) 
VALUES (
  '00000001-0000-0000-0000-000000000001'::uuid,
  'Admin User',
  'admin@example.com',
  'admin'
) 
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Insert the default regular user
INSERT INTO public.users (id, name, email, role) 
VALUES (
  '00000002-0000-0000-0000-000000000002'::uuid,
  'Jane User',
  'user@example.com',
  'user'
) 
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;
