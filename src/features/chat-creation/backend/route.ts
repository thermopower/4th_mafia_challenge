import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { CreateChatRequestSchema } from './schema';
import { createChatRoom, findExistingDirectChat } from './service';
import { chatCreationErrorCodes } from './error';

export const registerChatCreationRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/chat-rooms/create', async (c) => {
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

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return respond(
        c,
        failure(401, chatCreationErrorCodes.unauthorized, 'Unauthorized')
      );
    }

    const { type, name, user_ids } = parsedBody.data;

    if (type === 'direct' && user_ids.length === 1) {
      const existingChat = await findExistingDirectChat(
        supabase,
        user.id,
        user_ids[0]
      );
      if (existingChat.ok && existingChat.data) {
        return respond(c, existingChat);
      }
    }

    const result = await createChatRoom(supabase, {
      createdBy: user.id,
      type,
      name,
      participantIds: [user.id, ...user_ids],
    });

    if (!result.ok) {
      logger.error('Failed to create chat room', (result as any).error.message);
      return respond(c, result);
    }

    return respond(c, result);
  });
};
