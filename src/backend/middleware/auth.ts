import type { MiddlewareHandler } from 'hono';
import { failure, respond } from '@/backend/http/response';
import { getSupabase, type AppEnv } from '@/backend/hono/context';

/**
 * 인증 미들웨어
 * Authorization 헤더에서 Supabase JWT 토큰을 검증하고 userId를 컨텍스트에 주입
 */
export const withAuth = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return respond(
        c,
        failure(401, 'UNAUTHORIZED', '인증이 필요합니다.')
      );
    }

    // "Bearer " 접두사 제거
    const token = authHeader.replace(/^Bearer\s+/i, '');

    // Supabase 클라이언트로 JWT 토큰 검증
    const supabase = getSupabase(c);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return respond(
        c,
        failure(401, 'INVALID_TOKEN', '유효하지 않거나 만료된 토큰입니다.')
      );
    }

    // userId를 컨텍스트에 주입
    c.set('userId', user.id);

    await next();
  };
};

