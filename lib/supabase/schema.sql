-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free'::text not null,
  credits integer default 0 not null
);

-- Create documents table
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  title text not null,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  video_url text not null,
  video_title text not null,
  video_duration integer not null,
  status text default 'processing'::text not null,
  error_message text
);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

create trigger handle_documents_updated_at
  before update on public.documents
  for each row
  execute function public.handle_updated_at();

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.documents enable row level security;

-- Create policies
create policy "Users can view their own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own data"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can create their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Create indexes
create index users_email_idx on public.users (email);
create index documents_user_id_idx on public.documents (user_id);
create index documents_status_idx on public.documents (status); 