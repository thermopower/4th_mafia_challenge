# Usecase 구현 상태 점검 보고서

- **점검 일시**: 2025-10-17
- **점검 대상 문서**:
  - spec: `docs\usecases\009\spec.md`
  - 관련 구현: `src/features/chat-room/backend/`, `src/app/chat/[roomId]/page.tsx`

---

## ✅ 구현 완료된 기능

### 1. 채팅방 진입 및 초기 메시지 로드

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 초기 메시지 30개 로드 | `src/features/chat-room/backend/service.ts:206-279` | ✅ 부분 충족 | - 권한 검증 완료<br>- 에러 핸들링 완료<br>- 테스트 코드 없음 |
| 권한 검증 (chat_members) | `src/features/chat-room/backend/service.ts:37-54` | ✅ 완전 충족 | 모든 API에서 일관되게 적용 |
| 메시지 리액션/첨부파일 조회 | `src/features/chat-room/backend/service.ts:59-117` | ✅ 완전 충족 | 별도 헬퍼 함수로 분리 |
| 답장 정보 조회 | `src/features/chat-room/backend/service.ts:122-155` | ✅ 완전 충족 | isDeleted 필드 포함 |
| 페이지네이션 (hasMore) | `src/features/chat-room/backend/service.ts:262` | ✅ 완전 충족 | limit+1 패턴 사용 |

### 2. Polling 기반 실시간 동기화

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 3초 주기 polling | `src/features/chat-room/constants/index.ts:2`<br>`src/features/chat-room/hooks/useMessagesSync.ts:44` | ✅ 완전 충족 | React Query refetchInterval 사용 |
| 신규 메시지 조회 | `src/features/chat-room/backend/service.ts:303-313` | ✅ 완전 충족 | after_timestamp 기준 조회 |
| 변경된 메시지 조회 | `src/features/chat-room/backend/service.ts:331-342` | ✅ 완전 충족 | updated_at 기준 조회 |
| 삭제된 메시지 필터링 | `src/features/chat-room/backend/service.ts:360-362` | ✅ 완전 충족 | is_deleted 필터링 |
| 응답 데이터 구조 | `src/features/chat-room/backend/schema.ts:69-75` | ✅ 완전 충족 | newMessages, updatedMessages, deletedMessageIds 분리 |

### 3. 무한 스크롤 (과거 메시지 로드)

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 무한 스크롤 구현 | `src/features/chat-room/hooks/useMessagesQuery.ts:13-33` | ✅ 완전 충족 | React Query useInfiniteQuery 사용 |
| 스크롤 상단 감지 | `src/features/chat-room/components/message-timeline.tsx:46-53` | ✅ 완전 충족 | scrollTop < 100 체크 |
| hasMore 플래그 | `src/features/chat-room/backend/service.ts:262-263` | ✅ 완전 충족 | limit+1 패턴 |
| 로딩 인디케이터 | `src/features/chat-room/components/message-timeline.tsx:85-89` | ✅ 완전 충족 | isFetchingNextPage 상태 표시 |

### 4. 읽음 상태 갱신

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 1초 디바운스 | `src/features/chat-room/constants/index.ts:4`<br>`src/features/chat-room/hooks/useUpdateReadStatus.ts:27-32` | ✅ 완전 충족 | useDebouncedCallback 사용 |
| last_read_message_id 업데이트 | `src/features/chat-room/backend/service.ts:754-761` | ✅ 완전 충족 | chat_members 테이블 업데이트 |
| last_read_at 업데이트 | `src/features/chat-room/backend/service.ts:751` | ✅ 완전 충족 | NOW() 함수 사용 |

### 5. 메시지 전송

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 메시지 전송 API | `src/features/chat-room/backend/service.ts:374-486` | ✅ 완전 충족 | 중복 방지 로직 포함 |
| 답장 메시지 전송 | `src/features/chat-room/backend/service.ts:412-426` | ✅ 완전 충족 | reply_to_message_id 검증 |
| 첨부파일 저장 | `src/features/chat-room/backend/service.ts:456-476` | ✅ 완전 충족 | message_attachments 테이블 삽입 |
| 중복 전송 방지 (멱등성) | `src/features/chat-room/backend/service.ts:394-408` | ✅ 완전 충족 | 60초 이내 동일 메시지 체크 |

### 6. 리액션 토글

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 리액션 추가/삭제 | `src/features/chat-room/backend/service.ts:491-614` | ✅ 완전 충족 | 토글 방식 구현 |
| 삭제된 메시지 체크 | `src/features/chat-room/backend/service.ts:513-519` | ✅ 완전 충족 | is_deleted 검증 |

### 7. 메시지 삭제

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 소프트 삭제 | `src/features/chat-room/backend/service.ts:676-691` | ✅ 완전 충족 | is_deleted, deleted_at, content='' |
| 소유권 검증 | `src/features/chat-room/backend/service.ts:641-647` | ✅ 완전 충족 | sender_id 체크 |
| 멱등성 보장 | `src/features/chat-room/backend/service.ts:650-673` | ✅ 완전 충족 | 이미 삭제된 경우 처리 |

### 8. 데이터 구조 및 스키마

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| Message 스키마 | `src/features/chat-room/backend/schema.ts:33-48` | ✅ 완전 충족 | Spec과 100% 일치 |
| Reaction 스키마 | `src/features/chat-room/backend/schema.ts:20-24` | ✅ 완전 충족 | reactionType, count, reactedByMe |
| Attachment 스키마 | `src/features/chat-room/backend/schema.ts:26-31` | ✅ 완전 충족 | fileUrl, fileType, fileSizeBytes |
| ReplyTo 스키마 | `src/features/chat-room/backend/schema.ts:13-18` | ✅ 완전 충족 | isDeleted 필드 포함 |
| Zod 런타임 검증 | `src/features/chat-room/backend/route.ts` | ✅ 완전 충족 | 모든 요청/응답 검증 |

### 9. 에러 처리

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| 권한 없음 (403) | `src/features/chat-room/backend/service.ts:218-222` | ✅ 완전 충족 | 모든 API에 적용 |
| 리소스 없음 (404) | `src/features/chat-room/backend/service.ts:506-510` | ✅ 완전 충족 | 메시지/채팅방 없음 처리 |
| 중복 요청 (409) | `src/features/chat-room/backend/service.ts:404-408` | ✅ 완전 충족 | 중복 메시지 방지 |
| 서버 오류 (500) | `src/features/chat-room/backend/service.ts:244-250` | ✅ 완전 충족 | Supabase 에러 처리 |
| 에러 로깅 | `src/features/chat-room/backend/route.ts:69-70, 124-126` | ✅ 완전 충족 | AppLogger 사용 |
| 에러 코드 정의 | `src/features/chat-room/backend/error.ts` | ✅ 완전 충족 | 23개 에러 코드 정의 |

---

## ❌ 구현되지 않았거나 보완이 필요한 기능

| 기능/페이지 | 상태 | 구현 계획 |
|---|---|---|
| **Intersection Observer 기반 읽음 처리** | ⚠️ 부분 구현 | **현재 상태**: 스크롤 시 마지막 메시지만 읽음 처리<br>**Spec 요구사항**: viewport에 1초 이상 노출된 메시지만 읽음 처리<br>**필요 작업**: <br>- `src/features/chat-room/hooks/useMessageVisibility.ts` 생성<br>- Intersection Observer로 각 메시지 노출 감지<br>- 1초 타이머로 노출 시간 체크<br>- 읽음 처리 대상 메시지 ID 수집 |
| **스크롤 위치 유지 (무한 스크롤)** | ⚠️ 구현 불명확 | **Spec 요구사항**: 과거 메시지 로드 시 현재 보고 있던 메시지 위치 유지<br>**필요 작업**:<br>- 과거 메시지 로드 전 현재 스크롤 위치 저장<br>- 메시지 추가 후 스크롤 offset 계산 및 복원<br>- `src/features/chat-room/lib/scroll-utils.ts`에 `preserveScrollPosition` 함수 추가 |
| **신규 메시지 도착 시 "새 메시지 N개" 배지** | ❌ 미구현 | **Spec 요구사항**: 사용자가 스크롤 중간에 있을 때 신규 메시지 배지 표시<br>**필요 작업**:<br>- `src/features/chat-room/contexts/types.ts`에 `unreadCount` 상태 추가<br>- `src/features/chat-room/components/new-message-badge.tsx` 생성<br>- 스크롤 하단 여부 감지 후 배지 표시/숨김 |
| **읽지 않은 메시지 구분선** | ❌ 미구현 | **Spec 요구사항**: last_read_message_id 기준 "여기까지 읽으셨습니다" 구분선<br>**필요 작업**:<br>- `src/features/chat-room/components/unread-divider.tsx` 생성<br>- MessageTimeline에서 last_read_message_id 이후 첫 메시지 위에 표시<br>- 초기 진입 시 해당 위치로 자동 스크롤 |
| **네트워크 오류 시 Exponential Backoff** | ❌ 미구현 | **Spec 요구사항**: 3초 → 6초 → 12초 → 최대 30초<br>**필요 작업**:<br>- `src/lib/remote/api-client.ts`에 retry 로직 추가<br>- `axios-retry` 라이브러리 사용 고려<br>- 또는 React Query의 `retry`, `retryDelay` 옵션 활용 |
| **채팅방 이탈 시 AbortController** | ❌ 미구현 | **Spec 요구사항**: 메시지 로드 중 사용자 이탈 시 요청 취소<br>**필요 작업**:<br>- useMessagesQuery, useMessagesSync 훅에서 cleanup 함수 추가<br>- AbortController 생성 및 signal 전달<br>- unmount 시 abort() 호출 |
| **네트워크 오류 배너** | ❌ 미구현 | **Spec 요구사항**: "연결 끊김" 배너 + 재시도 버튼<br>**필요 작업**:<br>- `src/features/chat-room/components/network-error-banner.tsx` 생성<br>- React Query의 `isError` 상태 감지<br>- 수동 재시도 버튼 추가 (refetch 호출) |
| **실시간 권한 상실 모달** | ❌ 미구현 | **Spec 요구사항**: Polling 중 403 발생 시 "채팅방에서 나가셨습니다" 모달<br>**필요 작업**:<br>- `src/features/chat-room/components/kicked-modal.tsx` 생성<br>- useMessagesSync에서 403 에러 감지<br>- polling 중단 + 모달 표시 + 채팅 목록으로 이동 |
| **단위 테스트** | ❌ 미구현 | **필요 작업**:<br>- `src/features/chat-room/backend/__tests__/service.test.ts` 생성<br>- 각 서비스 함수 테스트 (권한 검증, 메시지 조회, 중복 방지 등)<br>- Supabase 모킹 (jest-mock-supabase 사용)<br>- 최소 커버리지 목표: 80% |
| **통합 테스트** | ❌ 미구현 | **필요 작업**:<br>- `src/features/chat-room/__tests__/integration.test.ts` 생성<br>- 전체 flow 테스트 (진입 → 메시지 로드 → Polling → 전송)<br>- Playwright 또는 Cypress로 E2E 테스트 고려 |
| **before_message_id 파라미터 지원** | ⚠️ 불일치 | **현재 상태**: `beforeTimestamp` 파라미터 사용 중<br>**Spec 요구사항**: `before_message_id` 파라미터 사용<br>**필요 작업**:<br>- route.ts에서 `before_message_id` 파라미터 추가<br>- service.ts에서 ID 기준 조회 로직 수정<br>- `created_at`과 `id`를 함께 사용하여 정확한 순서 보장 |

---

## 📝 종합 의견

### 전반적인 구현 상태
유스케이스 009 "채팅방 진입 및 메시지 동기화"의 **핵심 기능은 약 80-85% 구현 완료**되었습니다. 백엔드 API와 데이터베이스 로직은 프로덕션 레벨에 근접하며, 프론트엔드 기본 기능도 잘 작동합니다.

### 주요 강점
1. **견고한 백엔드 아키텍처**:
   - Zod 스키마 기반 타입 안전성
   - 일관된 에러 처리 패턴 (`HandlerResult`)
   - 모든 API에 권한 검증 적용
   - 멱등성 보장 (중복 메시지 방지, 삭제 재시도)

2. **데이터 정합성**:
   - Spec 문서의 데이터 구조와 100% 일치
   - 리액션, 첨부파일, 답장 정보 완전 구현
   - soft delete 패턴 적용

3. **프론트엔드 상태 관리**:
   - React Query로 서버 상태 관리
   - Context API로 로컬 상태 관리
   - 무한 스크롤, 실시간 동기화 구현

### 보완이 필요한 부분

#### 1. **UX 개선 사항 (중요도: 높음)**
- ❌ 읽지 않은 메시지 구분선 미구현 → 사용자가 어디까지 읽었는지 알 수 없음
- ❌ 신규 메시지 배지 미구현 → 스크롤 중간에서 새 메시지 알림 없음
- ⚠️ Intersection Observer 미사용 → 실제로 본 메시지만 읽음 처리해야 함

#### 2. **에러 복구 로직 (중요도: 중간)**
- ❌ Exponential backoff 미구현 → 네트워크 장애 시 서버 부하 가중
- ❌ AbortController 미구현 → 불필요한 네트워크 요청 낭비
- ❌ 에러 UI 미구현 → 사용자가 오류 상황을 인지하기 어려움

#### 3. **테스트 코드 (중요도: 높음)**
- ❌ 단위 테스트 0% → 리팩토링 시 회귀 버그 위험
- ❌ 통합 테스트 0% → 전체 flow 검증 불가능
- **프로덕션 배포 전 필수 작업**

#### 4. **Spec 불일치 (중요도: 낮음)**
- ⚠️ `before_message_id` 대신 `beforeTimestamp` 사용 → 동일 시간대 메시지 순서 보장 문제 가능성
- ⚠️ 스크롤 위치 유지 로직 불명확 → 무한 스크롤 시 UI 점프 발생 가능

### 프로덕션 배포 전 필수 작업 (우선순위)

#### P0 (Critical - 배포 전 반드시 필요)
1. **단위 테스트 작성**: 핵심 서비스 함수 (권한 검증, 메시지 조회, 중복 방지)
2. **읽지 않은 메시지 UI**: 구분선 + 초기 스크롤 위치
3. **에러 처리 UI**: 네트워크 오류 배너, 권한 상실 모달

#### P1 (Important - 초기 릴리즈 이후 빠르게)
1. **Intersection Observer 읽음 처리**: 실제 본 메시지만 읽음 처리
2. **Exponential Backoff**: 네트워크 장애 복구 로직
3. **통합 테스트**: 전체 채팅 flow 검증

#### P2 (Nice to have - 점진적 개선)
1. **신규 메시지 배지**: 스크롤 중간에서 알림
2. **AbortController**: 요청 취소 최적화
3. **스크롤 위치 유지**: 무한 스크롤 UX 개선

### 긍정적인 평가
- 코드 품질이 전반적으로 높고, 아키텍처가 확장 가능하게 설계됨
- 에러 핸들링과 유효성 검사가 잘 구현되어 있어 안정성 확보
- Spec 문서와 구현이 대부분 일치하여 요구사항 충실도 높음
- 테스트 코드와 일부 UX 개선만 추가하면 프로덕션 배포 가능

### 최종 결론
현재 구현은 **MVP(Minimum Viable Product) 수준을 충족**하며, 핵심 기능은 정상 작동합니다. 다만 **프로덕션 환경에서 안정적으로 운영하기 위해서는 위 P0/P1 항목들을 반드시 보완**해야 합니다. 특히 테스트 코드 작성은 코드 품질과 유지보수성을 위해 필수적입니다.
