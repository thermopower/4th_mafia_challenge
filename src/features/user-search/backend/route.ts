import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { UserSearchQuerySchema } from './schema';
import { searchUsers } from './service';
import { userSearchErrorCodes } from './error';

export const registerUserSearchRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/users/search', async (c) => {
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return respond(
        c,
        failure(401, userSearchErrorCodes.unauthorized, 'Unauthorized')
      );
    }

    const result = await searchUsers(
      supabase,
      parsedQuery.data.q,
      user.id,
      parsedQuery.data.limit
    );

    return respond(c, result);
  });
};
