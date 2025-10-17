import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { rateLimit } from '@/backend/middleware/rate-limit';
import { LoginRequestSchema, SignupRequestSchema } from './schema';
import { authenticateUser, createUserWithSession } from './service';
import {
  authErrorCodes,
  type AuthServiceError,
  signupErrorCodes,
  type SignupServiceError,
} from './error';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/auth/login', rateLimit({ maxRequests: 5 }), async (c) => {
    const body = await c.req.json();
    const parsedBody = LoginRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          authErrorCodes.validationError,
          'Invalid login request',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const { email, password, rememberMe } = parsedBody.data;

    const result = await authenticateUser(supabase, email, password, rememberMe);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AuthServiceError, unknown>;

      if (
        errorResult.error.code === authErrorCodes.databaseError ||
        errorResult.error.code === authErrorCodes.sessionCreationFailed
      ) {
        logger.error('Login failed', {
          code: errorResult.error.code,
          message: errorResult.error.message,
        });
      }

      logger.info('Login attempt', {
        email,
        success: false,
        code: errorResult.error.code,
      });

      return respond(c, result);
    }

    logger.info('Login successful', {
      email,
      userId: result.data.user.id,
    });

    return respond(c, result);
  });

  app.post('/api/auth/signup', rateLimit({ maxRequests: 5 }), async (c) => {
    const body = await c.req.json();
    const parsedRequest = SignupRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return respond(
        c,
        failure(
          400,
          signupErrorCodes.validationError,
          'The provided signup data is invalid.',
          parsedRequest.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createUserWithSession(supabase, parsedRequest.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SignupServiceError, unknown>;

      if (errorResult.error.code === signupErrorCodes.databaseError) {
        logger.error('Signup database error', errorResult.error.message);
      } else if (
        errorResult.error.code === signupErrorCodes.sessionCreationFailed
      ) {
        logger.error(
          'Session creation failed during signup',
          errorResult.error.message
        );
      }

      return respond(c, result);
    }

    logger.info('User signup successful', { userId: result.data.user.id });

    return c.json({
      success: true,
      data: result.data,
      redirectTo: '/chat',
    });
  });
};
