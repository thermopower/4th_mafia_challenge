import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, getUserId, type AppEnv } from '@/backend/hono/context';
import { rateLimit } from '@/backend/middleware/rate-limit';
import { withAuth } from '@/backend/middleware/auth';
import { CreateChatRequestSchema } from './schema';
import { createChatRoom, findExistingDirectChat } from './service';
import { chatCreationErrorCodes } from './error';

export const registerChatCreationRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/chat-rooms/create', withAuth(), rateLimit({ maxRequests: 10 }), async (c) => {
    const body = await c.req.json();
    const parsedBody = CreateChatRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          chatCreationErrorCodes.invalidRequest,
          'Invalid request body',
          parsedBody.error.format()
        )
      );
    }

    const userId = getUserId(c);
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const { type, name, user_ids } = parsedBody.data;

    if (type === 'direct' && user_ids.length === 1) {
      const existingChat = await findExistingDirectChat(
        supabase,
        userId,
        user_ids[0]
      );
      if (existingChat.ok && existingChat.data) {
        return respond(c, existingChat);
      }
    }

    const result = await createChatRoom(supabase, {
      createdBy: userId,
      type,
      name,
      participantIds: [userId, ...user_ids],
    });

    if (!result.ok) {
      logger.error('Failed to create chat room', (result as any).error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });
};
