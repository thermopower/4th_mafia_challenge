-- ============================================
-- Migration: Seed representative sample data
-- Purpose: Provide roughly two sample rows per table for local development
-- Date: 2025-10-18
-- ============================================

create extension if not exists "pgcrypto";

create table if not exists public.example (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  avatar_url text,
  bio text,
  updated_at timestamptz not null default now()
);

alter table if exists public.example disable row level security;

do $$
declare
  v_user_lena uuid := '0d65c920-3d7f-4553-91de-59101cf15f01';
  v_user_mason uuid := '5ba8d2d5-6ebe-44d1-a0fd-7da8c5c0d502';
  v_user_nova uuid := 'c2ab5cd9-6572-496a-9fe2-8f9c731c0e03';

  v_chat_direct_primary uuid := '8bbb2a0e-61aa-4ec6-8b16-010203040506';
  v_chat_direct_secondary uuid := '93ccec31-792f-473e-98fd-112233445566';

  v_message_1 uuid := '11111111-aaaa-bbbb-cccc-000000000001';
  v_message_2 uuid := '11111111-aaaa-bbbb-cccc-000000000002';
  v_message_3 uuid := '11111111-aaaa-bbbb-cccc-000000000003';
  v_message_4 uuid := '11111111-aaaa-bbbb-cccc-000000000004';

  v_attachment_1 uuid := '22222222-bbbb-cccc-dddd-000000000001';
  v_attachment_2 uuid := '22222222-bbbb-cccc-dddd-000000000002';

  v_example_1 uuid := '33333333-cccc-dddd-eeee-000000000001';
  v_example_2 uuid := '33333333-cccc-dddd-eeee-000000000002';

  v_now timestamptz := now();
  v_instance uuid := '00000000-0000-0000-0000-000000000000';
  v_default_password text := '$2a$10$Oe8d9cOuh9Cvi9zdTO7OxeHDhyls/ux/lA4CLqEpeDhy9ySpx0v6O';
begin
  -- Seed auth.users so that the profile trigger can populate public.users
  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  )
  values
    (
      v_user_lena,
      v_instance,
      'lena.hart@example.com',
      v_default_password,
      v_now,
      v_now,
      jsonb_build_object(
        'nickname', 'Lena Hart',
        'profile_image_url', 'https://picsum.photos/seed/lena-hart/200/200'
      ),
      'authenticated',
      'authenticated',
      v_now,
      v_now
    ),
    (
      v_user_mason,
      v_instance,
      'mason.cho@example.com',
      v_default_password,
      v_now,
      v_now,
      jsonb_build_object(
        'nickname', 'Mason Cho',
        'profile_image_url', 'https://picsum.photos/seed/mason-cho/200/200'
      ),
      'authenticated',
      'authenticated',
      v_now,
      v_now
    ),
    (
      v_user_nova,
      v_instance,
      'nova.lee@example.com',
      v_default_password,
      v_now,
      v_now,
      jsonb_build_object(
        'nickname', 'Nova Lee',
        'profile_image_url', 'https://picsum.photos/seed/nova-lee/200/200'
      ),
      'authenticated',
      'authenticated',
      v_now,
      v_now
    )
  on conflict (id) do nothing;

  -- Ensure public.users rows reflect the intended sample metadata
  insert into public.users (id, nickname, profile_image_url, account_status, terms_agreed_at, created_at, updated_at)
  values
    (v_user_lena, 'Lena Hart', 'https://picsum.photos/seed/lena-hart/200/200', 'active', v_now - interval '14 days', v_now - interval '14 days', v_now - interval '1 day'),
    (v_user_mason, 'Mason Cho', 'https://picsum.photos/seed/mason-cho/200/200', 'active', v_now - interval '10 days', v_now - interval '10 days', v_now - interval '1 day'),
    (v_user_nova, 'Nova Lee', 'https://picsum.photos/seed/nova-lee/200/200', 'active', v_now - interval '7 days', v_now - interval '7 days', v_now - interval '1 day')
  on conflict (id) do update
    set nickname = excluded.nickname,
        profile_image_url = excluded.profile_image_url,
        account_status = excluded.account_status,
        terms_agreed_at = excluded.terms_agreed_at;

  -- Seed chat_rooms with two direct channels for pairing samples
  insert into public.chat_rooms (id, room_type, name, created_by, created_at, updated_at)
  values
    (v_chat_direct_primary, 'direct', null, v_user_lena, v_now - interval '6 days', v_now - interval '6 days'),
    (v_chat_direct_secondary, 'direct', null, v_user_mason, v_now - interval '5 days', v_now - interval '5 days')
  on conflict (id) do nothing;

  -- Seed chat_direct_pairs to prevent duplicate direct-room creation
  insert into public.chat_direct_pairs (chat_room_id, user_a_id, user_b_id, created_at, updated_at)
  values
    (v_chat_direct_primary, v_user_lena, v_user_mason, v_now - interval '6 days', v_now - interval '6 days'),
    (v_chat_direct_secondary, v_user_mason, v_user_nova, v_now - interval '5 days', v_now - interval '5 days')
  on conflict (chat_room_id) do nothing;

  -- Seed chat_members for each room
  insert into public.chat_members (chat_room_id, user_id, joined_at, created_at, updated_at)
  values
    (v_chat_direct_primary, v_user_lena, v_now - interval '6 days', v_now - interval '6 days', v_now - interval '1 day'),
    (v_chat_direct_primary, v_user_mason, v_now - interval '6 days', v_now - interval '6 days', v_now - interval '12 hours'),
    (v_chat_direct_secondary, v_user_mason, v_now - interval '5 days', v_now - interval '5 days', v_now - interval '10 hours'),
    (v_chat_direct_secondary, v_user_nova, v_now - interval '5 days', v_now - interval '5 days', v_now - interval '8 hours')
  on conflict (chat_room_id, user_id) do nothing;

  -- Seed messages for each chat room
  insert into public.messages (
    id,
    chat_room_id,
    sender_id,
    message_type,
    content,
    reply_to_message_id,
    is_deleted,
    deleted_at,
    created_at,
    updated_at
  )
  values
    (
      v_message_1,
      v_chat_direct_primary,
      v_user_lena,
      'text',
      'Morning sync at 09:30 works for you?',
      null,
      false,
      null,
      v_now - interval '6 days' + interval '2 hours',
      v_now - interval '6 days' + interval '2 hours'
    ),
    (
      v_message_2,
      v_chat_direct_primary,
      v_user_mason,
      'file',
      'https://cdn.example.com/files/agenda.pdf',
      v_message_1,
      false,
      null,
      v_now - interval '6 days' + interval '2 hours' + interval '10 minutes',
      v_now - interval '6 days' + interval '2 hours' + interval '10 minutes'
    ),
    (
      v_message_3,
      v_chat_direct_secondary,
      v_user_mason,
      'text',
      'Can you review the updated onboarding copy?',
      null,
      false,
      null,
      v_now - interval '5 days' + interval '1 hour',
      v_now - interval '5 days' + interval '1 hour'
    ),
    (
      v_message_4,
      v_chat_direct_secondary,
      v_user_nova,
      'text',
      'Looks good! I will polish the CTA section.',
      v_message_3,
      false,
      null,
      v_now - interval '5 days' + interval '1 hour' + interval '7 minutes',
      v_now - interval '5 days' + interval '1 hour' + interval '7 minutes'
    )
  on conflict (id) do nothing;

  -- Seed message attachments linked to the file message
  insert into public.message_attachments (id, message_id, file_url, file_type, file_size_bytes, created_at, updated_at)
  values
    (
      v_attachment_1,
      v_message_2,
      'https://cdn.example.com/files/agenda.pdf',
      'application/pdf',
      24576,
      v_now - interval '6 days' + interval '2 hours' + interval '10 minutes',
      v_now - interval '6 days' + interval '2 hours' + interval '10 minutes'
    ),
    (
      v_attachment_2,
      v_message_2,
      'https://cdn.example.com/previews/agenda.png',
      'image/png',
      8192,
      v_now - interval '6 days' + interval '2 hours' + interval '11 minutes',
      v_now - interval '6 days' + interval '2 hours' + interval '11 minutes'
    )
  on conflict (id) do nothing;

  -- Seed message reactions referencing the seeded messages
  insert into public.message_reactions (message_id, user_id, reaction_type, created_at, updated_at)
  values
    (v_message_1, v_user_mason, 'like', v_now - interval '6 days' + interval '2 hours' + interval '30 minutes', v_now - interval '6 days' + interval '2 hours' + interval '30 minutes'),
    (v_message_3, v_user_nova, 'empathy', v_now - interval '5 days' + interval '1 hour' + interval '15 minutes', v_now - interval '5 days' + interval '1 hour' + interval '15 minutes')
  on conflict do nothing;

  -- Add additional sample rows to the example table
  insert into public.example (id, full_name, avatar_url, bio, updated_at)
  values
    (
      v_example_1,
      'Sample Coach',
      'https://picsum.photos/seed/sample-coach/200/200',
      'Helps teams adopt async collaboration habits.',
      v_now - interval '3 days'
    ),
    (
      v_example_2,
      'Sample Strategist',
      'https://picsum.photos/seed/sample-strategist/200/200',
      'Guides onboarding experiments and reporting cadence.',
      v_now - interval '2 days'
    )
  on conflict (id) do nothing;

exception
  when others then
    raise;
end;
$$;
