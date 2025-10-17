-- Migration: Restore foreign key constraints after auth migration
-- This migration adds back the foreign key constraints that were lost
-- when the users table was dropped and recreated in migration 0005

-- Re-create foreign key constraints
-- Note: Using "IF NOT EXISTS" pattern through DO block to handle idempotency

do $$
begin
  -- chat_rooms.created_by -> users(id)
  if not exists (
    select 1 from pg_constraint
    where conname = 'chat_rooms_created_by_fkey'
  ) then
    alter table public.chat_rooms
      add constraint chat_rooms_created_by_fkey
      foreign key (created_by) references public.users(id) on delete restrict;
  end if;

  -- messages.sender_id -> users(id)
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_sender_id_fkey'
  ) then
    alter table public.messages
      add constraint messages_sender_id_fkey
      foreign key (sender_id) references public.users(id) on delete cascade;
  end if;

  -- chat_members.user_id -> users(id)
  if not exists (
    select 1 from pg_constraint
    where conname = 'chat_members_user_id_fkey'
  ) then
    alter table public.chat_members
      add constraint chat_members_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;

  -- chat_direct_pairs.user_a_id -> users(id)
  if not exists (
    select 1 from pg_constraint
    where conname = 'chat_direct_pairs_user_a_id_fkey'
  ) then
    alter table public.chat_direct_pairs
      add constraint chat_direct_pairs_user_a_id_fkey
      foreign key (user_a_id) references public.users(id) on delete cascade;
  end if;

  -- chat_direct_pairs.user_b_id -> users(id)
  if not exists (
    select 1 from pg_constraint
    where conname = 'chat_direct_pairs_user_b_id_fkey'
  ) then
    alter table public.chat_direct_pairs
      add constraint chat_direct_pairs_user_b_id_fkey
      foreign key (user_b_id) references public.users(id) on delete cascade;
  end if;

  -- message_reactions.user_id -> users(id)
  if not exists (
    select 1 from pg_constraint
    where conname = 'message_reactions_user_id_fkey'
  ) then
    alter table public.message_reactions
      add constraint message_reactions_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
end $$;

comment on constraint chat_rooms_created_by_fkey on public.chat_rooms is 'Foreign key to users table';
comment on constraint messages_sender_id_fkey on public.messages is 'Foreign key to users table';
comment on constraint chat_members_user_id_fkey on public.chat_members is 'Foreign key to users table';
