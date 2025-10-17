import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getSupabase, getUserId, type AppEnv } from '@/backend/hono/context';
import { withAuth } from '@/backend/middleware/auth';
import { UserSearchQuerySchema } from './schema';
import { searchUsers } from './service';
import { userSearchErrorCodes } from './error';

export const registerUserSearchRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/users/search', withAuth(), async (c) => {
    const parsedQuery = UserSearchQuerySchema.safeParse({
      q: c.req.query('q'),
      limit: c.req.query('limit'),
    });

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(
          400,
          userSearchErrorCodes.invalidQuery,
          'Invalid query',
          parsedQuery.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const userId = getUserId(c);

    const result = await searchUsers(
      supabase,
      parsedQuery.data.q,
      userId,
      parsedQuery.data.limit
    );

    return respond(c, result);
  });
};
