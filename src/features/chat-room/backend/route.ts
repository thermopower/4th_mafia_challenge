import type { Hono } from 'hono';
import { z } from 'zod';
import { failure, respond } from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  getUserId,
  type AppEnv,
} from '@/backend/hono/context';
import { withAuth } from '@/backend/middleware/auth';
import {
  SendMessageRequestSchema,
  ToggleReactionRequestSchema,
  UpdateReadStatusRequestSchema,
} from './schema';
import {
  getInitialMessages,
  syncMessages,
  sendMessage,
  toggleReaction,
  deleteMessage,
  updateReadStatus,
} from './service';
import { chatRoomErrorCodes } from './error';

/**
 * 채팅방 라우트 등록
 */
export const registerChatRoomRoutes = (app: Hono<AppEnv>) => {
  // 1. 초기 메시지 로드 & 무한 스크롤
  app.get('/api/chat-rooms/:roomId/messages', withAuth(), async (c) => {
    const roomId = c.req.param('roomId');
    const beforeTimestamp = c.req.query('beforeTimestamp');
    const limit = c.req.query('limit');

    // roomId 검증
    const roomIdValidation = z.string().uuid().safeParse(roomId);
    if (!roomIdValidation.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_ROOM_ID',
          '유효하지 않은 채팅방 ID입니다.',
          roomIdValidation.error.format()
        )
      );
    }

    const userId = getUserId(c);
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getInitialMessages(
      supabase,
      userId,
      roomId,
      beforeTimestamp,
      limit ? parseInt(limit, 10) : undefined
    );

    if (!result.ok) {
      logger.error('Failed to fetch initial messages', (result as any).error.message);
    }

    return respond(c, result);
  });

  // 2. Polling 동기화
  app.get('/api/chat-rooms/:roomId/messages/sync', withAuth(), async (c) => {
    const roomId = c.req.param('roomId');
    const afterTimestamp = c.req.query('afterTimestamp');

    // roomId 검증
    const roomIdValidation = z.string().uuid().safeParse(roomId);
    if (!roomIdValidation.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_ROOM_ID',
          '유효하지 않은 채팅방 ID입니다.',
          roomIdValidation.error.format()
        )
      );
    }

    // afterTimestamp 검증
    if (!afterTimestamp) {
      return respond(
        c,
        failure(
          400,
          'MISSING_AFTER_TIMESTAMP',
          'afterTimestamp 파라미터가 필요합니다.'
        )
      );
    }

    const userId = getUserId(c);
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await syncMessages(
      supabase,
      userId,
      roomId,
      afterTimestamp
    );

    if (!result.ok) {
      logger.error('Failed to sync messages', (result as any).error.message);
    }

    return respond(c, result);
  });

  // 3. 메시지 전송
  app.post('/api/messages', withAuth(), async (c) => {
    const userId = getUserId(c);
    const body = await c.req.json();
    const parsedBody = SendMessageRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REQUEST_BODY',
          '요청 본문이 유효하지 않습니다.',
          parsedBody.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await sendMessage(supabase, userId, parsedBody.data);

    if (!result.ok) {
      if ((result as any).error.code === chatRoomErrorCodes.duplicateMessage) {
        logger.info('Duplicate message detected', (result as any).error.message);
      } else {
        logger.error('Failed to send message', (result as any).error.message);
      }
    }

    return respond(c, result);
  });

  // 4. 리액션 토글
  app.post('/api/messages/:messageId/reactions', withAuth(), async (c) => {
    const messageId = c.req.param('messageId');

    // messageId 검증
    const messageIdValidation = z.string().uuid().safeParse(messageId);
    if (!messageIdValidation.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_MESSAGE_ID',
          '유효하지 않은 메시지 ID입니다.',
          messageIdValidation.error.format()
        )
      );
    }

    const userId = getUserId(c);
    const body = await c.req.json();
    const parsedBody = z
      .object({ reactionType: z.enum(['like', 'bookmark', 'empathy']) })
      .safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REQUEST_BODY',
          '요청 본문이 유효하지 않습니다.',
          parsedBody.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await toggleReaction(supabase, userId, {
      messageId,
      reactionType: parsedBody.data.reactionType,
    });

    if (!result.ok) {
      logger.error('Failed to toggle reaction', (result as any).error.message);
    }

    return respond(c, result);
  });

  // 5. 메시지 삭제
  app.delete('/api/messages/:messageId', withAuth(), async (c) => {
    const messageId = c.req.param('messageId');

    // messageId 검증
    const messageIdValidation = z.string().uuid().safeParse(messageId);
    if (!messageIdValidation.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_MESSAGE_ID',
          '유효하지 않은 메시지 ID입니다.',
          messageIdValidation.error.format()
        )
      );
    }

    const userId = getUserId(c);
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await deleteMessage(supabase, userId, messageId);

    if (!result.ok) {
      logger.error('Failed to delete message', (result as any).error.message);
    }

    return respond(c, result);
  });

  // 6. 읽음 상태 업데이트
  app.post('/api/chat-rooms/:roomId/read', withAuth(), async (c) => {
    const roomId = c.req.param('roomId');

    // roomId 검증
    const roomIdValidation = z.string().uuid().safeParse(roomId);
    if (!roomIdValidation.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_ROOM_ID',
          '유효하지 않은 채팅방 ID입니다.',
          roomIdValidation.error.format()
        )
      );
    }

    const userId = getUserId(c);
    const body = await c.req.json();
    const parsedBody = z
      .object({ lastReadMessageId: z.string().uuid() })
      .safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REQUEST_BODY',
          '요청 본문이 유효하지 않습니다.',
          parsedBody.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await updateReadStatus(
      supabase,
      userId,
      roomId,
      parsedBody.data.lastReadMessageId
    );

    if (!result.ok) {
      logger.error('Failed to update read status', (result as any).error.message);
    }

    return respond(c, result);
  });
};
