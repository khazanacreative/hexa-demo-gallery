-- Create projects table
create table projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  cover_image text,
  screenshots text[],
  demo_url text,
  category text,
  tags text[],
  features text[],
  user_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on user_id for better query performance
create index projects_user_id_idx on projects(user_id);
