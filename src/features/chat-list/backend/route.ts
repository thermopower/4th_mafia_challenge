import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, getUserId, type AppEnv } from '@/backend/hono/context';
import { withAuth } from '@/backend/middleware/auth';
import { ChatListQuerySchema } from './schema';
import { getChatRoomsByUserId } from './service';
import { chatListErrorCodes } from './error';

export const registerChatListRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/chat/rooms', withAuth(), async (c) => {
    const parsedQuery = ChatListQuerySchema.safeParse({
      since: c.req.query('since'),
      limit: c.req.query('limit'),
    });

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(
          400,
          chatListErrorCodes.invalidQuery,
          'Invalid query parameters',
          parsedQuery.error.format()
        )
      );
    }

    const userId = getUserId(c);
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getChatRoomsByUserId(
      supabase,
      userId,
      parsedQuery.data.since,
      parsedQuery.data.limit
    );

    if (!result.ok) {
      logger.error('Failed to fetch chat rooms', (result as any).error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });
};
