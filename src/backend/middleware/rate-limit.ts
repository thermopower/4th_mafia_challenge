import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';

interface RateLimitOptions {
  /**
   * 시간 윈도우 (밀리초)
   * @default 60000 (1분)
   */
  windowMs?: number;
  /**
   * 시간 윈도우 내 최대 요청 수
   * @default 5
   */
  maxRequests?: number;
  /**
   * Rate limit 키 생성 함수
   * @default IP 주소 기반
   */
  keyGenerator?: (c: Context<AppEnv>) => string;
  /**
   * 에러 메시지
   * @default '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
   */
  message?: string;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory 저장소 (프로덕션에서는 Redis 사용 권장)
const store = new Map<string, RateLimitRecord>();

/**
 * Rate Limiting 미들웨어
 *
 * @example
 * ```typescript
 * // IP 기반 분당 5회 제한
 * app.post('/api/auth/login', rateLimit({ maxRequests: 5 }), handler)
 *
 * // 사용자 ID 기반 분당 10회 제한
 * app.post('/api/chat-rooms/create', rateLimit({
 *   maxRequests: 10,
 *   keyGenerator: (c) => c.get('userId') || getIp(c)
 * }), handler)
 * ```
 */
export const rateLimit = (options: RateLimitOptions = {}) => {
  const {
    windowMs = 60000, // 1분
    maxRequests = 5,
    keyGenerator = (c) => getIp(c),
    message = '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
  } = options;

  return createMiddleware<AppEnv>(async (c, next) => {
    const key = keyGenerator(c);
    const now = Date.now();

    // 기존 레코드 조회
    let record = store.get(key);

    // 윈도우가 만료되었으면 초기화
    if (record && record.resetAt <= now) {
      record = undefined;
      store.delete(key);
    }

    // 레코드가 없으면 생성
    if (!record) {
      record = {
        count: 0,
        resetAt: now + windowMs,
      };
      store.set(key, record);
    }

    // 요청 카운트 증가
    record.count++;

    // 제한 초과 확인
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);

      return c.json(
        {
          error: {
            code: 'TOO_MANY_REQUESTS',
            message,
            retryAfter,
          },
        },
        429,
      );
    }

    // 응답 헤더 추가
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(maxRequests - record.count));
    c.header('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

    await next();
  });
};

/**
 * IP 주소 추출 헬퍼 함수
 */
function getIp(c: Context<AppEnv>): string {
  // x-forwarded-for 헤더 확인 (프록시 환경)
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // x-real-ip 헤더 확인
  const realIp = c.req.header('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 기본값
  return 'unknown';
}

/**
 * 사용자 ID 기반 Rate Limiting
 * 인증된 사용자의 ID를 키로 사용합니다.
 *
 * @example
 * ```typescript
 * app.post('/api/chat-rooms/create', rateLimitByUser({ maxRequests: 10 }), handler)
 * ```
 */
export const rateLimitByUser = (
  options: Omit<RateLimitOptions, 'keyGenerator'> = {},
) => {
  return rateLimit({
    ...options,
    keyGenerator: (c) => {
      // context에 저장된 userId 사용
      const userId = c.get('userId' as never) as unknown as string | undefined;
      // userId가 없으면 IP 주소로 폴백
      return userId || getIp(c);
    },
  });
};

/**
 * 주기적으로 만료된 레코드를 정리하는 함수
 * 프로덕션 환경에서는 별도 스케줄러로 실행 권장
 */
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  }
}

// 5분마다 정리 (선택적)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
}
