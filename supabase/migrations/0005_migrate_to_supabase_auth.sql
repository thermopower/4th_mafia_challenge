-- Migration: Migrate from custom auth to Supabase Auth
-- WARNING: This migration will drop custom auth tables and restructure users table
-- Backup your data before running this migration

-- Step 1: Drop user_sessions table (Supabase Auth handles sessions)
drop table if exists public.user_sessions cascade;

-- Step 2: Create a backup of current users table
create table if not exists public.users_backup as
select * from public.users;

-- Step 3: Drop the old users table
drop table if exists public.users cascade;

-- Step 4: Create new users table as profile extension for auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname varchar(50) not null,
  profile_image_url text not null default 'https://picsum.photos/seed/default-profile/200/200',
  account_status text not null default 'active' check (account_status in ('active', 'inactive', 'suspended', 'withdrawn')),
  terms_agreed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Step 5: Create trigger for updated_at
drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

-- Step 6: Enable RLS for users table (Supabase Auth best practice)
alter table public.users enable row level security;

-- Step 7: Create RLS policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Step 8: Create function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, nickname, profile_image_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'profile_image_url',
      'https://picsum.photos/seed/' || new.id::text || '/200/200'
    )
  );
  return new;
end;
$$;

-- Step 9: Create trigger on auth.users to auto-create profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Step 10: Disable RLS on other tables (as per project guidelines)
alter table if exists public.chat_rooms disable row level security;
alter table if exists public.chat_direct_pairs disable row level security;
alter table if exists public.chat_members disable row level security;
alter table if exists public.messages disable row level security;
alter table if exists public.message_attachments disable row level security;
alter table if exists public.message_reactions disable row level security;

-- Step 11: Create index for faster user lookups
create index if not exists idx_users_account_status on public.users(account_status);

comment on table public.users is 'User profile data, linked to auth.users';
comment on column public.users.id is 'References auth.users.id';
comment on column public.users.nickname is 'Display name for the user';
comment on column public.users.profile_image_url is 'URL to user profile image';
comment on column public.users.account_status is 'User account status: active, inactive, suspended, or withdrawn';
