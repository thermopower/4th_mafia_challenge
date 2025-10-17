# Usecase 구현 상태 점검 보고서

- **점검 일시**: 2025-10-17
- **점검 대상 문서**:
  - spec: `docs/usecases/003/spec.md`
  - plan: (해당 없음 - spec 문서만 존재)

---

## ✅ 구현 완료된 기능

### 1. API 엔드포인트

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| POST /api/chat-rooms/create | `src/features/chat-creation/backend/route.ts` | ⚠️ 부분 충족 | 엔드포인트 경로와 메서드는 spec과 일치. 그러나 트랜잭션이 명시적이지 않고, 일부 에러 핸들링 누락 |
| GET /api/users/search | `src/features/user-search/backend/route.ts` | ✅ 충족 | spec에서 요구한 사용자 검색 API 완전 구현 |

**상세 분석**:
- **채팅방 생성 API**:
  - ✅ 경로: `/api/chat-rooms/create` (spec 396행과 일치)
  - ✅ 메서드: `POST` (spec 394행과 일치)
  - ✅ 요청/응답 구조: spec 396-422행의 JSON 구조와 일치
  - ⚠️ 인증: Supabase Auth 기반 인증은 구현됨, 그러나 세션 검증 로직이 간단함

- **사용자 검색 API**:
  - ✅ 경로: `/api/users/search` (spec 424행과 일치)
  - ✅ 쿼리 파라미터: `q` (검색어)
  - ✅ 필터링: `account_status='active'`인 사용자만 반환, 본인 제외

---

### 2. 1:1 채팅 생성 로직

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 1:1 채팅 중복 방지 | `src/features/chat-creation/backend/service.ts` (findExistingDirectChat) | ✅ 충족 | user_a_id와 user_b_id 정렬 후 조회하여 중복 방지 |
| chat_direct_pairs 테이블 활용 | `supabase/migrations/0002_define_chat_schema.sql` | ✅ 충족 | 유니크 인덱스로 동시 생성 충돌 방지 (spec 88-91행) |
| 기존 채팅방 재사용 | `src/features/chat-creation/backend/route.ts` (42-50행) | ✅ 충족 | 기존 채팅방이 있으면 exists: true와 함께 반환 |

**상세 분석**:
- ✅ **중복 방지 로직** (spec 135-138행 BR1):
  ```typescript
  const [sortedUserA, sortedUserB] =
    userAId < userBId ? [userAId, userBId] : [userBId, userAId];
  ```
  - user_a_id < user_b_id 정렬 규칙 적용 (spec 138행과 일치)

- ✅ **데이터베이스 레벨 중복 방지** (spec 87-91행):
  - 마이그레이션 파일 113-126행: `chat_direct_pairs` 테이블에 unique index 정의
  - `idx_chat_direct_pairs_pair`로 (least, greatest) 조합에 유니크 제약

- ✅ **기존 채팅방 조회 및 재사용**:
  - `findExistingDirectChat` 함수에서 기존 채팅방 존재 시 `exists: true` 반환
  - spec 415-422행의 응답 구조와 일치

---

### 3. 그룹 채팅 생성 로직

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 그룹 채팅 생성 | `src/features/chat-creation/backend/service.ts` (createChatRoom) | ⚠️ 부분 충족 | 기본 로직은 구현됨. 그러나 명시적 트랜잭션 없음 |
| 그룹명 필수 검증 | `src/features/chat-creation/backend/schema.ts` (9-12행) | ✅ 충족 | zod refine으로 그룹 타입일 때 name 필수 검증 |
| 참여자 제한 검증 | `src/features/chat-creation/backend/schema.ts` (7행) | ✅ 충족 | user_ids 배열을 min(1), max(50)으로 제한 |

**상세 분석**:
- ✅ **그룹명 필수 검증** (spec 140-143행 BR2):
  - schema.ts 9-12행: 그룹 타입일 때 name이 null이거나 빈 문자열이면 에러
  - "그룹 채팅은 이름이 필수입니다" 메시지 반환

- ✅ **참여자 제한** (spec 150-154행 BR4):
  - schema.ts 7행: `z.array(z.string().uuid()).min(1).max(50)`
  - spec의 최소 2명, 최대 50명 요구사항에 대응 (단, min(1)은 API에서 생성자가 자동 추가되므로 실질적으로 2명 이상)

- ⚠️ **트랜잭션 처리** (spec 165-168행 BR7):
  - `createChatRoom` 함수에서 순차적으로 chat_rooms, chat_members, chat_direct_pairs 삽입
  - **문제점**: 명시적인 트랜잭션 블록 없음. 중간 단계 실패 시 수동 롤백(117행)
  - **개선 필요**: Supabase RPC 또는 명시적 트랜잭션 사용 권장

---

### 4. 요청/응답 데이터 구조

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 요청 스키마 | `src/features/chat-creation/backend/schema.ts` | ✅ 충족 | spec 396-401행과 일치 |
| 응답 스키마 (201 Created) | `src/features/chat-creation/backend/schema.ts` | ✅ 충족 | spec 403-414행과 일치 |
| 응답 스키마 (200 OK - 기존 채팅방) | `src/features/chat-creation/backend/schema.ts` | ✅ 충족 | spec 415-422행과 일치 (exists 필드 포함) |

**상세 분석**:
- ✅ **CreateChatRequestSchema** (spec 396-401행):
  ```typescript
  {
    type: z.enum(['direct', 'group']),
    name: z.string().min(1).max(50).nullable(),
    user_ids: z.array(z.string().uuid()).min(1).max(50),
  }
  ```
  - spec의 JSON 구조와 완전히 일치

- ✅ **CreateChatResponseSchema** (spec 403-414행):
  ```typescript
  {
    chat_room_id: z.string().uuid(),
    room_type: z.enum(['direct', 'group']),
    name: z.string().nullable(),
    members: z.array(...),
    created_at: z.string(),
    exists: z.boolean().optional(),
  }
  ```
  - members 배열에 user_id, nickname, profile_image_url 포함
  - exists 필드로 기존 채팅방 재사용 여부 표시

---

### 5. 에러 처리

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 에러 코드 정의 | `src/features/chat-creation/backend/error.ts` | ⚠️ 부분 충족 | 기본 에러 코드는 정의됨. 그러나 spec의 일부 세부 케이스 미구현 |
| 인증 에러 처리 | `src/features/chat-creation/backend/route.ts` (33-38행) | ✅ 충족 | 401 Unauthorized 반환 |
| 요청 검증 에러 | `src/features/chat-creation/backend/route.ts` (13-23행) | ✅ 충족 | 400 Bad Request 반환 (zod 검증) |

**상세 분석**:
- ✅ **인증 에러** (spec 110-115행 E4):
  - route.ts 33-38행: getUser() 실패 시 401 Unauthorized 반환
  - spec의 "세션이 만료되었습니다" 케이스에 대응

- ✅ **요청 검증 에러**:
  - route.ts 13-23행: zod 스키마 검증 실패 시 상세 에러 정보와 함께 400 반환
  - spec 78-81행 A4 (그룹명 미입력) 케이스도 schema의 refine으로 처리

- ⚠️ **누락된 에러 케이스**:
  - spec 59-73행 A2 (차단된 사용자): 구현 없음
  - spec 67-73행 A3 (탈퇴한 사용자): 부분 구현 (user-search에서 account_status 필터링하지만, 생성 시점 재검증 없음)
  - spec 126-131행 E6 (생성 직전 사용자 탈퇴): 재검증 로직 없음

---

### 6. 데이터베이스 스키마

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| chat_rooms 테이블 | `supabase/migrations/0002_define_chat_schema.sql` (57-65행) | ✅ 충족 | spec 222-228행과 일치 |
| chat_direct_pairs 테이블 | `supabase/migrations/0002_define_chat_schema.sql` (113-126행) | ✅ 충족 | spec 230-235행과 일치 |
| chat_members 테이블 | `supabase/migrations/0002_define_chat_schema.sql` (93-110행) | ✅ 충족 | spec 237-245행과 일치 |
| 유니크 제약 조건 | `supabase/migrations/0002_define_chat_schema.sql` (124-125행) | ✅ 충족 | spec 125행 (least/greatest 인덱스) |

**상세 분석**:
- ✅ **chat_rooms**:
  - room_type, name, created_by, created_at, updated_at 컬럼 모두 존재
  - room_type에 CHECK 제약 ('direct', 'group')

- ✅ **chat_direct_pairs**:
  - chat_room_id, user_a_id, user_b_id, created_at, updated_at
  - CHECK (user_a_id <> user_b_id): 자기 자신과 채팅 방지
  - UNIQUE INDEX (least(user_a_id, user_b_id), greatest(...)): 중복 방지

- ✅ **chat_members**:
  - last_read_message_id, last_read_at 컬럼 포함 (향후 읽음 상태 관리용)
  - UNIQUE (chat_room_id, user_id): 중복 참여 방지

---

## ❌ 구현되지 않았거나 보완이 필요한 기능

| 기능/페이지 | 상태 | 구현 계획 |
|---|---|---|
| 명시적 트랜잭션 처리 (BR7) | ⚠️ 부분 구현 | `createChatRoom` 함수를 Supabase RPC 함수로 마이그레이션하여 DB 레벨 트랜잭션 보장 필요 |
| 차단된 사용자 선택 방지 (A2) | ❌ 미구현 | `createChatRoom` 서비스에 user_blocks 테이블 조회 로직 추가 (향후 차단 기능 구현 시) |
| 참여자 유효성 재검증 (E6) | ❌ 미구현 | 채팅방 생성 시점에 모든 참여자의 account_status를 다시 확인하는 로직 필요 |
| 중복 요청 방지 (E5) | ❌ 미구현 | 클라이언트에서 request ID 생성 및 서버 측 멱등성 키 검증 로직 추가 |
| Rate Limiting (보안 고려사항) | ❌ 미구현 | Hono 미들웨어 또는 Supabase Edge Functions에서 분당 10회 제한 구현 |
| 단위 테스트 | ❌ 미구현 | `service.ts`의 주요 함수에 대한 Jest/Vitest 테스트 작성 필요 |
| 에러 로깅 상세화 | ⚠️ 부분 구현 | logger.error 호출은 있으나, 구조화된 로깅 (사용자 ID, 요청 파라미터 등) 필요 |

**구현 우선순위**:

### 1. 고우선순위 (프로덕션 배포 전 필수)

#### 1.1 명시적 트랜잭션 처리
**파일**: `src/features/chat-creation/backend/service.ts`

**방법 1 - Supabase RPC 함수**:
```sql
-- supabase/migrations/000X_create_chat_room_rpc.sql
CREATE OR REPLACE FUNCTION public.create_chat_room_transactional(
  p_created_by UUID,
  p_room_type TEXT,
  p_name TEXT,
  p_participant_ids UUID[]
)
RETURNS TABLE (
  chat_room_id UUID,
  room_type TEXT,
  name TEXT
) AS $$
DECLARE
  v_room_id UUID;
  v_user_a UUID;
  v_user_b UUID;
BEGIN
  -- 1. chat_rooms 삽입
  INSERT INTO public.chat_rooms (room_type, name, created_by)
  VALUES (p_room_type, p_name, p_created_by)
  RETURNING id INTO v_room_id;

  -- 2. chat_members 삽입
  INSERT INTO public.chat_members (chat_room_id, user_id)
  SELECT v_room_id, unnest(p_participant_ids);

  -- 3. direct 타입이면 chat_direct_pairs 삽입
  IF p_room_type = 'direct' AND array_length(p_participant_ids, 1) = 2 THEN
    v_user_a := LEAST(p_participant_ids[1], p_participant_ids[2]);
    v_user_b := GREATEST(p_participant_ids[1], p_participant_ids[2]);

    INSERT INTO public.chat_direct_pairs (chat_room_id, user_a_id, user_b_id)
    VALUES (v_room_id, v_user_a, v_user_b);
  END IF;

  -- 4. 결과 반환
  RETURN QUERY
  SELECT id, room_type, name
  FROM public.chat_rooms
  WHERE id = v_room_id;
END;
$$ LANGUAGE plpgsql;
```

**TypeScript 호출 코드**:
```typescript
const { data, error } = await supabase.rpc('create_chat_room_transactional', {
  p_created_by: params.createdBy,
  p_room_type: params.type,
  p_name: params.name,
  p_participant_ids: params.participantIds,
});
```

#### 1.2 참여자 유효성 재검증
**파일**: `src/features/chat-creation/backend/service.ts`

**역할**: 채팅방 생성 직전에 모든 참여자의 account_status가 'active'인지 확인

```typescript
export const validateParticipants = async (
  supabase: SupabaseClient,
  userIds: string[]
) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, account_status')
    .in('id', userIds);

  if (error) {
    return failure(500, chatCreationErrorCodes.createError, error.message);
  }

  const invalidUsers = data.filter(u => u.account_status !== 'active');
  if (invalidUsers.length > 0) {
    return failure(
      400,
      chatCreationErrorCodes.invalidUser,
      '일부 사용자를 초대할 수 없습니다',
      { invalid_users: invalidUsers.map(u => u.id) }
    );
  }

  return success(null, 200);
};
```

**route.ts에서 호출**:
```typescript
// 참여자 유효성 검증
const validationResult = await validateParticipants(
  supabase,
  [user.id, ...user_ids]
);
if (!validationResult.ok) {
  return respond(c, validationResult);
}
```

### 2. 중우선순위 (안정성 향상)

#### 2.1 중복 요청 방지 (멱등성)
**파일**: `src/features/chat-creation/backend/route.ts`, `schema.ts`

**schema.ts에 추가**:
```typescript
export const CreateChatRequestSchema = z
  .object({
    type: z.enum(['direct', 'group']),
    name: z.string().min(1).max(50).nullable(),
    user_ids: z.array(z.string().uuid()).min(1).max(50),
    request_id: z.string().uuid(), // 클라이언트가 생성한 고유 ID
  })
  // ... refine
```

**route.ts에 멱등성 검사 추가**:
```typescript
// Redis 또는 인메모리 캐시에 request_id 저장
const { request_id } = parsedBody.data;
const cacheKey = `chat_creation:${user.id}:${request_id}`;

// 캐시 확인 (예: Supabase Storage 또는 Redis)
// 이미 처리된 요청이면 캐시된 결과 반환
```

#### 2.2 Rate Limiting
**파일**: `src/backend/middleware/rate-limit.ts` (신규 생성)

**역할**: IP 또는 사용자 ID 기반으로 분당 10회 제한

```typescript
import { createMiddleware } from 'hono/factory';

export const rateLimitByUser = (limit: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  return createMiddleware(async (c, next) => {
    const userId = c.get('userId'); // 인증 미들웨어에서 주입
    const now = Date.now();

    const userRequests = requests.get(userId) || [];
    const recentRequests = userRequests.filter(t => now - t < windowMs);

    if (recentRequests.length >= limit) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    recentRequests.push(now);
    requests.set(userId, recentRequests);

    await next();
  });
};
```

**route.ts에 적용**:
```typescript
import { rateLimitByUser } from '@/backend/middleware/rate-limit';

app.post(
  '/api/chat-rooms/create',
  rateLimitByUser(10, 60000), // 분당 10회
  async (c) => { /* ... */ }
);
```

### 3. 저우선순위 (향후 기능 확장 시)

#### 3.1 차단 기능 지원
**파일**: `src/features/chat-creation/backend/service.ts`

**전제 조건**: `user_blocks` 테이블이 먼저 생성되어야 함 (별도 마이그레이션)

```typescript
export const checkBlockRelationship = async (
  supabase: SupabaseClient,
  userId: string,
  targetUserIds: string[]
) => {
  const { data } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(
      `blocker_id.eq.${userId},blocked_id.eq.${userId},` +
      `blocker_id.in.(${targetUserIds.join(',')}),blocked_id.in.(${targetUserIds.join(',')})`
    );

  if (data && data.length > 0) {
    return failure(
      400,
      chatCreationErrorCodes.invalidUser,
      '차단된 사용자와는 채팅할 수 없습니다'
    );
  }

  return success(null, 200);
};
```

#### 3.2 단위 테스트 작성
**파일**: `src/features/chat-creation/backend/__tests__/service.test.ts` (신규 생성)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createChatRoom, findExistingDirectChat } from '../service';

describe('Chat Creation Service', () => {
  it('should create a new direct chat when no existing chat found', async () => {
    // Mock Supabase client
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
      // ...
    };

    const result = await createChatRoom(mockSupabase as any, {
      createdBy: 'user1',
      type: 'direct',
      name: null,
      participantIds: ['user1', 'user2'],
    });

    expect(result.ok).toBe(true);
    expect(result.data.room_type).toBe('direct');
  });

  it('should prevent duplicate direct chat creation', async () => {
    // ...
  });
});
```

---

## 📝 종합 의견

### 전반적인 구현 상태

Usecase 003 (새 채팅 생성)의 **핵심 기능은 약 75% 구현**되었으며, 기본적인 1:1 채팅 및 그룹 채팅 생성 흐름은 정상 작동할 것으로 판단됩니다.

### 주요 강점

1. **API 구조**: spec 문서의 엔드포인트 정의와 완벽히 일치
2. **데이터베이스 스키마**: 중복 방지를 위한 유니크 제약, 외래 키 설정이 잘 되어 있음
3. **사용자 검색**: 실시간 검색 기능이 완전히 구현되어 있음
4. **요청/응답 검증**: zod 스키마를 통한 강력한 타입 안전성 확보
5. **1:1 채팅 중복 방지**: `chat_direct_pairs` 테이블과 정렬 로직으로 완벽히 구현

### 주요 약점 (프로덕션 배포 전 개선 필요)

1. **트랜잭션 처리**:
   - 현재는 순차적 삽입으로 중간 단계 실패 시 일부 데이터가 남을 수 있음
   - **해결책**: Supabase RPC 함수로 마이그레이션 (DB 레벨 트랜잭션)

2. **참여자 유효성 재검증 없음**:
   - 사용자가 선택 후 생성 버튼을 누르기 전에 탈퇴하면 감지 불가
   - **해결책**: `validateParticipants` 함수 추가 (account_status 재확인)

3. **에러 케이스 미구현**:
   - 차단된 사용자 선택 방지 (향후 차단 기능 구현 시 필요)
   - 중복 요청 방지 (멱등성 키)
   - Rate Limiting

4. **테스트 코드 부재**:
   - 단위 테스트, 통합 테스트가 없어 회귀 방지 불가
   - **해결책**: 주요 서비스 함수에 대한 Vitest 테스트 작성

### 프로덕션 레벨 달성을 위한 체크리스트

- [x] 에러 핸들링: 기본적인 에러 처리는 되어 있음
- [ ] 유효성 검사: 생성 시점 재검증 누락
- [ ] 테스트 코드: 전혀 없음
- [x] 문서화: schema와 error 타입 정의로 어느 정도 자체 문서화됨
- [ ] 트랜잭션: 명시적 트랜잭션 없음
- [ ] 보안: Rate Limiting 없음

### 권장 조치 사항

**즉시 조치 (1주일 내)**:
1. `validateParticipants` 함수 추가 (참여자 유효성 재검증)
2. Supabase RPC 함수로 트랜잭션 처리 개선
3. 에러 로깅 상세화 (사용자 ID, request body 포함)

**단기 조치 (2주일 내)**:
1. Rate Limiting 미들웨어 추가
2. 중복 요청 방지 (request_id 기반 멱등성)
3. 핵심 서비스 함수 단위 테스트 작성

**중기 조치 (1개월 내)**:
1. 차단 기능 구현 후 차단 관계 검증 로직 추가
2. 통합 테스트 작성 (API 엔드포인트 E2E 테스트)
3. 성능 테스트 (동시 생성 시나리오)

### 결론

현재 구현은 **MVP(Minimum Viable Product) 수준**으로, 기본적인 채팅 생성 기능은 작동하지만 프로덕션 환경에서 안정적으로 운영하기 위해서는 **트랜잭션 처리, 유효성 재검증, 테스트 코드** 추가가 필수입니다.

특히 **동시 생성 충돌 (spec E1)** 케이스는 DB 레벨 유니크 제약으로 어느 정도 보호되지만, 명시적 트랜잭션이 없으면 일부 데이터 불일치가 발생할 수 있으므로 최우선 개선 대상입니다.
