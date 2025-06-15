
-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
-- Policy for users to view their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy for authenticated users to view other users (for general app functionality)
CREATE POLICY "Authenticated users can view all users" 
  ON public.users 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policy for admins to insert new users (if needed for user management)
CREATE POLICY "Admins can insert users" 
  ON public.users 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for admins to delete users (if needed for user management)
CREATE POLICY "Admins can delete users" 
  ON public.users 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
