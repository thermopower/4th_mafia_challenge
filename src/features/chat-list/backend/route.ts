import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { ChatListQuerySchema } from './schema';
import { getChatRoomsByUserId } from './service';
import { chatListErrorCodes } from './error';

export const registerChatListRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/chat/rooms', async (c) => {
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

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return respond(
        c,
        failure(401, chatListErrorCodes.unauthorized, 'Unauthorized')
      );
    }

    const result = await getChatRoomsByUserId(
      supabase,
      user.id,
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
