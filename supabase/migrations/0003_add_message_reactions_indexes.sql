-- ============================================
-- 마이그레이션: message_reactions 테이블 인덱스 추가
-- 목적: 리액션 조회 성능 최적화
-- 날짜: 2025-10-17
-- 관련 유스케이스: 006 (메시지 리액션)
-- ============================================

-- 메시지별 리액션 조회 성능 향상
-- 특정 메시지의 모든 리액션을 조회할 때 사용
CREATE INDEX IF NOT EXISTS idx_message_reactions_message
ON public.message_reactions(message_id);

-- 사용자별 리액션 조회 성능 향상
-- 특정 사용자가 추가한 모든 리액션을 조회할 때 사용
CREATE INDEX IF NOT EXISTS idx_message_reactions_user
ON public.message_reactions(user_id);

-- 인덱스 생성 확인
COMMENT ON INDEX public.idx_message_reactions_message IS '메시지별 리액션 조회 최적화';
COMMENT ON INDEX public.idx_message_reactions_user IS '사용자별 리액션 조회 최적화';
