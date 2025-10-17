import type { MiddlewareHandler } from 'hono';
import { failure, respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';

/**
 * 토큰에서 userId를 추출하는 유틸리티 함수
 */
const extractUserIdFromToken = (token: string): string | null => {
  try {
    // "Bearer " 접두사 제거
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    // Base64 디코딩
    const payload = JSON.parse(Buffer.from(cleanToken, 'base64').toString());

    // 만료 시간 검증
    if (payload.exp && Date.now() > payload.exp) {
      return null; // 토큰 만료
    }

    // 토큰 타입 검증
    if (payload.type !== 'access') {
      return null; // access 토큰이 아님
    }

    return payload.userId || null;
  } catch {
    return null; // 파싱 실패
  }
};

/**
 * 인증 미들웨어
 * Authorization 헤더에서 토큰을 검증하고 userId를 컨텍스트에 주입
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

    const userId = extractUserIdFromToken(authHeader);

    if (!userId) {
      return respond(
        c,
        failure(401, 'INVALID_TOKEN', '유효하지 않거나 만료된 토큰입니다.')
      );
    }

    // userId를 컨텍스트에 주입
    c.set('userId', userId);

    await next();
  };
};

