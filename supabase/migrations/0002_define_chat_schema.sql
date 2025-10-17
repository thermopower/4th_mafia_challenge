-- Migration: define chat application schema derived from confirmed userflows
-- Ensures pgcrypto and updated_at automation are available
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $body$
begin
  execute $sql$
    create table if not exists public.users (
      id uuid primary key default gen_random_uuid(),
      email text not null,
      password_hash text not null,
      nickname varchar(50) not null,
      profile_image_url text not null default 'https://picsum.photos/seed/default-profile/200/200',
      account_status text not null default 'active' check (account_status in ('active', 'inactive', 'suspended', 'withdrawn')),
      login_fail_count integer not null default 0,
      terms_agreed_at timestamptz not null,
      mfa_required boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  $sql$;

  execute $sql$
    create unique index if not exists idx_users_email_ci
    on public.users (lower(email))
  $sql$;

  execute $sql$
    create table if not exists public.user_sessions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.users(id) on delete cascade,
      refresh_token text not null,
      expires_at timestamptz not null,
      created_at timestamptz not null default now(),
      last_seen_at timestamptz not null default now(),
      revoked_at timestamptz,
      updated_at timestamptz not null default now()
    )
  $sql$;

  execute $sql$
    create unique index if not exists idx_user_sessions_refresh_token
    on public.user_sessions (refresh_token)
  $sql$;

  execute $sql$
    create table if not exists public.chat_rooms (
      id uuid primary key default gen_random_uuid(),
      room_type text not null check (room_type in ('direct', 'group')),
      name varchar(100),
      created_by uuid not null references public.users(id) on delete restrict,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  $sql$;

  execute $sql$
    create table if not exists public.messages (
      id uuid primary key default gen_random_uuid(),
      chat_room_id uuid not null references public.chat_rooms(id) on delete cascade,
      sender_id uuid not null references public.users(id) on delete cascade,
      message_type text not null check (message_type in ('text', 'emoji', 'file', 'system')),
      content text,
      reply_to_message_id uuid,
      is_deleted boolean not null default false,
      deleted_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint messages_content_required check (
        (message_type in ('text', 'emoji', 'system') and content is not null)
        or (message_type = 'file' and content is not null)
      ),
      constraint messages_reply_self_fk foreign key (reply_to_message_id) references public.messages(id) on delete set null
    )
  $sql$;

  execute $sql$
    create index if not exists idx_messages_room_created_at
    on public.messages (chat_room_id, created_at desc)
  $sql$;

  execute $sql$
    create table if not exists public.chat_members (
      id uuid primary key default gen_random_uuid(),
      chat_room_id uuid not null references public.chat_rooms(id) on delete cascade,
      user_id uuid not null references public.users(id) on delete cascade,
      joined_at timestamptz not null default now(),
      last_read_message_id uuid,
      last_read_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (chat_room_id, user_id),
      constraint chat_members_last_read_fk foreign key (last_read_message_id) references public.messages(id) on delete set null
    )
  $sql$;

  execute $sql$
    create index if not exists idx_chat_members_user
    on public.chat_members (user_id)
  $sql$;

  execute $sql$
    create table if not exists public.chat_direct_pairs (
      chat_room_id uuid primary key references public.chat_rooms(id) on delete cascade,
      user_a_id uuid not null references public.users(id) on delete cascade,
      user_b_id uuid not null references public.users(id) on delete cascade,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      check (user_a_id <> user_b_id)
    )
  $sql$;

  execute $sql$
    create unique index if not exists idx_chat_direct_pairs_pair
    on public.chat_direct_pairs (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id))
  $sql$;

  execute $sql$
    create table if not exists public.message_attachments (
      id uuid primary key default gen_random_uuid(),
      message_id uuid not null references public.messages(id) on delete cascade,
      file_url text not null,
      file_type varchar(100) not null,
      file_size_bytes bigint not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  $sql$;

  execute $sql$
    create table if not exists public.message_reactions (
      message_id uuid not null references public.messages(id) on delete cascade,
      user_id uuid not null references public.users(id) on delete cascade,
      reaction_type text not null check (reaction_type in ('like', 'bookmark', 'empathy')),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (message_id, user_id, reaction_type)
    )
  $sql$;

  perform pg_catalog.set_config('search_path', current_setting('search_path'), true);

  if not exists (select 1 from pg_trigger where tgname = 'set_users_updated_at') then
    execute $sql$
      create trigger set_users_updated_at
      before update on public.users
      for each row
      execute function public.set_updated_at()
    $sql$;
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_user_sessions_updated_at') then
    execute $sql$
      create trigger set_user_sessions_updated_at
      before update on public.user_sessions
      for each row
      execute function public.set_updated_at()
    $sql$;
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_chat_rooms_updated_at') then
    execute $sql$
      create trigger set_chat_rooms_updated_at
      before update on public.chat_rooms
      for each row
      execute function public.set_updated_at()
    $sql$;
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_messages_updated_at') then
    execute $sql$
      create trigger set_messages_updated_at
      before update on public.messages
      for each row
      execute function public.set_updated_at()
    $sql$;
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_chat_members_updated_at') then
    execute $sql$
      create trigger set_chat_members_updated_at
      before update on public.chat_members
      for each row
      execute function public.set_updated_at()
    $sql$;
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_chat_direct_pairs_updated_at') then
    execute $sql$
      create trigger set_chat_direct_pairs_updated_at
      before update on public.chat_direct_pairs
      for each row
      execute function public.set_updated_at()
    $sql$;
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_message_attachments_updated_at') then
    execute $sql$
      create trigger set_message_attachments_updated_at
      before update on public.message_attachments
      for each row
      execute function public.set_updated_at()
    $sql$;
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_message_reactions_updated_at') then
    execute $sql$
      create trigger set_message_reactions_updated_at
      before update on public.message_reactions
      for each row
      execute function public.set_updated_at()
    $sql$;
  end if;

  execute $sql$ alter table if exists public.users disable row level security $sql$;
  execute $sql$ alter table if exists public.user_sessions disable row level security $sql$;
  execute $sql$ alter table if exists public.chat_rooms disable row level security $sql$;
  execute $sql$ alter table if exists public.chat_direct_pairs disable row level security $sql$;
  execute $sql$ alter table if exists public.chat_members disable row level security $sql$;
  execute $sql$ alter table if exists public.messages disable row level security $sql$;
  execute $sql$ alter table if exists public.message_attachments disable row level security $sql$;
  execute $sql$ alter table if exists public.message_reactions disable row level security $sql$;

exception
  when others then
    raise;
end
$body$;
