-- ============================================
-- 마이그레이션: 채팅방 생성 트랜잭션 RPC 함수
-- 목적: 채팅방 생성 시 원자성 보장
-- 날짜: 2025-10-17
-- 관련 유스케이스: 003 (채팅방 생성)
-- ============================================

-- 채팅방 생성 트랜잭션 함수
-- chat_rooms, chat_members, chat_direct_pairs 테이블에 대한 삽입을 하나의 트랜잭션으로 처리
CREATE OR REPLACE FUNCTION public.create_chat_room_transactional(
  p_created_by UUID,
  p_room_type TEXT,
  p_name TEXT,
  p_participant_ids UUID[]
)
RETURNS TABLE (
  chat_room_id UUID,
  room_type TEXT,
  name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_room_id UUID;
  v_user_a UUID;
  v_user_b UUID;
  v_participant_id UUID;
BEGIN
  -- 1. chat_rooms 테이블에 채팅방 생성
  INSERT INTO public.chat_rooms (room_type, name, created_by, created_at, updated_at)
  VALUES (p_room_type, p_name, p_created_by, NOW(), NOW())
  RETURNING id INTO v_room_id;

  -- 2. chat_members 테이블에 참여자 추가
  FOREACH v_participant_id IN ARRAY p_participant_ids
  LOOP
    INSERT INTO public.chat_members (
      chat_room_id,
      user_id,
      joined_at,
      created_at,
      updated_at
    )
    VALUES (
      v_room_id,
      v_participant_id,
      NOW(),
      NOW(),
      NOW()
    );
  END LOOP;

  -- 3. direct 타입이면 chat_direct_pairs 테이블에 추가
  IF p_room_type = 'direct' AND array_length(p_participant_ids, 1) = 2 THEN
    -- user_a_id < user_b_id 순서로 정렬
    IF p_participant_ids[1] < p_participant_ids[2] THEN
      v_user_a := p_participant_ids[1];
      v_user_b := p_participant_ids[2];
    ELSE
      v_user_a := p_participant_ids[2];
      v_user_b := p_participant_ids[1];
    END IF;

    INSERT INTO public.chat_direct_pairs (
      chat_room_id,
      user_a_id,
      user_b_id,
      created_at,
      updated_at
    )
    VALUES (
      v_room_id,
      v_user_a,
      v_user_b,
      NOW(),
      NOW()
    );
  END IF;

  -- 4. 생성된 채팅방 정보 반환
  RETURN QUERY
  SELECT
    id AS chat_room_id,
    cr.room_type,
    cr.name,
    cr.created_at,
    cr.updated_at
  FROM public.chat_rooms cr
  WHERE id = v_room_id;
END;
$$;

-- 함수 설명 추가
COMMENT ON FUNCTION public.create_chat_room_transactional IS '채팅방 생성을 트랜잭션으로 처리하는 RPC 함수. chat_rooms, chat_members, chat_direct_pairs 테이블 삽입을 원자적으로 수행합니다.';

-- 함수 권한 설정 (필요시 조정)
-- GRANT EXECUTE ON FUNCTION public.create_chat_room_transactional TO authenticated;
