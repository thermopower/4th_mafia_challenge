# Usecase 008 구현 상태 점검 보고서

- **점검 일시**: 2025-10-17
- **점검 대상 문서**:
  - spec: `docs/usecases/008/spec.md`
  - 관련 구현: `src/features/chat-list/`

---

## ✅ 구현 완료된 기능

### 1. API 엔드포인트

| 항목 | Spec 요구사항 | 구현 상태 | 관련 파일 |
|---|---|---|---|
| 엔드포인트 경로 | `GET /api/chat/rooms` | ✅ 일치 | `src/features/chat-list/backend/route.ts:9` |
| Authorization | Bearer 토큰 기반 인증 | ✅ 구현 | `route.ts:30-40` (Supabase auth.getUser) |
| Query Parameters | `since`, `limit` 지원 | ✅ 구현 | `route.ts:10-13`, `schema.ts:3-6` |

### 2. 채팅방 목록 조회 로직

| 항목 | Spec 요구사항 | 구현 상태 | 관련 파일 |
|---|---|---|---|
| 참여 채팅방 조회 | 사용자가 참여한 모든 채팅방 | ✅ 구현 | `service.ts:16-30` (chat_rooms join chat_members) |
| 최신 메시지 조회 | 각 채팅방의 최신 메시지 | ✅ 구현 | `service.ts:52-58` (messages 쿼리) |
| 읽지 않은 메시지 개수 | last_read_message_id 기준 계산 | ✅ 구현 | `service.ts:65-71` (unread count 쿼리) |
| 참여자 정보 조회 | 프로필 이미지, 닉네임 포함 | ✅ 구현 | `service.ts:73-83` (participants 조회) |
| 삭제된 메시지 필터 | is_deleted = false | ✅ 구현 | `service.ts:70` (필터 조건 포함) |

### 3. Polling 기반 자동 갱신

| 항목 | Spec 요구사항 | 구현 상태 | 관련 파일 |
|---|---|---|---|
| Polling 주기 | 5초 간격 | ✅ 구현 | `use-chat-list-query.ts:9` (POLL_INTERVAL = 5000) |
| React Query 설정 | refetchInterval 적용 | ✅ 구현 | `use-chat-list-query.ts:32` |
| since 파라미터 | 변경된 채팅방만 조회 | ⚠️ 부분 구현 | `service.ts:32-34` (쿼리에만 추가, 최적화 미흡) |
| 상태 동기화 | 기존 목록과 병합 | ✅ 구현 | `context.ts:42-68` (UPSERT_ROOMS 로직) |

### 4. 정렬 우선순위

| 항목 | Spec 요구사항 | 구현 상태 | 관련 파일 |
|---|---|---|---|
| 최신 메시지 기준 정렬 | updated_at 내림차순 | ✅ 구현 | `service.ts:29` (DB 쿼리), `context.ts:55-58` (클라이언트) |
| 메시지 없는 채팅방 | created_at 기준 정렬 | ✅ 구현 | `context.ts:56-57` (fallback 로직) |
| 정렬 옵션 | recent / alphabetical | ✅ 구현 | `context.ts:55-61` (sortBy 지원) |

### 5. 요청/응답 데이터 구조

| 항목 | Spec 요구사항 | 구현 상태 | 관련 파일 |
|---|---|---|---|
| ChatRoomItem 스키마 | id, type, name, participants, lastMessage, unreadCount, createdAt, updatedAt | ✅ 완전 일치 | `schema.ts:24-33` |
| LastMessage 스키마 | id, content, type, senderId, senderNickname, isDeleted, createdAt | ✅ 완전 일치 | `schema.ts:14-22` |
| Participant 스키마 | id, nickname, profileImageUrl | ✅ 완전 일치 | `schema.ts:8-12` |
| ChatListResponse | rooms, hasMore, updatedAt | ✅ 완전 일치 | `schema.ts:35-39`, `service.ts:108-112` |

### 6. 에러 처리 및 예외 케이스

| 항목 | Spec 요구사항 | 구현 상태 | 관련 파일 |
|---|---|---|---|
| 세션 만료 (401) | Unauthorized 처리 | ✅ 구현 | `route.ts:35-40` |
| 네트워크 실패 | 에러 메시지 표시 및 재시도 | ✅ 구현 | `chat-list-panel.tsx:36-47` |
| 빈 목록 | 안내 메시지 및 Empty State | ✅ 구현 | `chat-list-empty-state.tsx:5-17` |
| 읽지 않은 메시지 999+ | 배지 제한 표시 | ✅ 구현 | `chat-room-item.tsx:66` |
| 긴 메시지 미리보기 | 50자 제한 및 "..." 처리 | ✅ 구현 | `chat-room-item.tsx:37`, `text.ts:1-5` |
| 프로필 이미지 fallback | picsum.photos 기본 이미지 | ✅ 구현 | `service.ts:6-7`, `chat-room-item.tsx:45` |

### 7. UI/UX 구현

| 항목 | Spec 요구사항 | 구현 상태 | 관련 파일 |
|---|---|---|---|
| 로딩 상태 (Skeleton UI) | 초기 로딩 시 표시 | ✅ 구현 | `chat-list-skeleton.tsx:4-21` |
| 상대 시간 표시 | "방금 전", "3분 전", "어제" 등 | ✅ 구현 | `time.ts:4-14` (formatRelativeTime) |
| 읽지 않은 메시지 볼드체 | 채팅방 이름 강조 | ✅ 구현 | `chat-room-item.tsx:52-54` |
| 채팅방 타입별 이름 표시 | direct: 상대방 닉네임, group: 참여자 목록 | ✅ 구현 | `chat-room-item.tsx:20-28` |
| 삭제된 메시지 표시 | "삭제된 메시지입니다" | ✅ 구현 | `chat-room-item.tsx:35-37` |

---

## ❌ 구현되지 않았거나 보완이 필요한 기능

### 1. since 파라미터 최적화 (우선순위: 높음)

| 상태 | 설명 |
|---|---|
| **현재 상태** | `since` 파라미터가 쿼리에는 포함되어 있지만, 실제로 변경된 채팅방만 반환하는 최적화 로직이 미흡합니다. |
| **문제점** | - Polling 시마다 전체 채팅방 목록을 조회하므로 불필요한 데이터 전송 발생<br>- 메시지가 없는 채팅방도 매번 조회됨<br>- 참여자 정보를 Promise.all로 N+1 쿼리 수행 |
| **구현 계획** | **파일**: `src/features/chat-list/backend/service.ts`<br>**함수**: `getChatRoomsByUserId` 수정<br>**내용**:<br>1. `since` 파라미터가 있을 때 `chat_rooms.updated_at > since` 조건만 조회<br>2. 새 메시지가 있는 채팅방만 필터링<br>3. 참여자 정보는 초기 조회 시에만 포함, 갱신 시에는 제외 |

### 2. 테스트 코드 부재 (우선순위: 높음)

| 상태 | 설명 |
|---|---|
| **현재 상태** | 채팅 목록 기능에 대한 단위/통합 테스트 코드가 존재하지 않습니다. |
| **문제점** | - 리팩토링 시 회귀 버그 발생 위험<br>- 비즈니스 로직 검증 불가<br>- 프로덕션 레벨 요구사항 미충족 |
| **구현 계획** | **파일**: `src/features/chat-list/backend/__tests__/service.test.ts`<br>**테스트 케이스**:<br>- 정상적인 채팅방 목록 조회<br>- 빈 목록 처리<br>- 읽지 않은 메시지 개수 계산 정확도<br>- since 파라미터 동작<br>- limit 페이지네이션<br><br>**파일**: `src/features/chat-list/hooks/__tests__/use-chat-list-query.test.ts`<br>**테스트 케이스**:<br>- Polling 동작 검증<br>- 에러 발생 시 상태 업데이트<br>- 성공 시 context 업데이트 |

### 3. 데이터베이스 쿼리 성능 최적화 (우선순위: 중간)

| 상태 | 설명 |
|---|---|
| **현재 상태** | - N+1 쿼리 문제: 각 채팅방마다 최신 메시지, 읽지 않은 개수, 참여자를 개별 쿼리<br>- Promise.all로 병렬 처리하지만 여전히 비효율적 |
| **문제점** | - 채팅방이 100개 이상일 때 성능 저하<br>- DB 연결 리소스 낭비 |
| **구현 계획** | **파일**: `src/features/chat-list/backend/service.ts`<br>**함수**: `getChatRoomsByUserId` 최적화<br>**내용**:<br>1. Supabase의 `rpc` 함수 활용하여 단일 쿼리로 모든 정보 조회<br>2. PostgreSQL CTE (Common Table Expression) 사용<br>3. 서브쿼리를 통한 최신 메시지 조인 |

### 4. Exponential Backoff 미구현 (우선순위: 중간)

| 상태 | 설명 |
|---|---|
| **현재 상태** | Polling 실패 시 고정된 5초 간격으로 재시도합니다. |
| **문제점** | - 네트워크 장애 시 서버 부하 증가<br>- Spec의 BR-5 (Exponential Backoff) 요구사항 미충족 |
| **구현 계획** | **파일**: `src/features/chat-list/hooks/use-chat-list-query.ts`<br>**함수**: `useChatListQuery` 수정<br>**내용**:<br>1. React Query의 `retry` 및 `retryDelay` 옵션 활용<br>2. 실패 횟수에 따라 5초 → 10초 → 20초 → 60초(최대) 증가<br>3. 성공 시 다시 5초로 리셋 |

### 5. 검색 및 필터 기능 미구현 (우선순위: 낮음)

| 상태 | 설명 |
|---|---|
| **현재 상태** | Context에 `filters.search` 필드는 있지만, UI 컴포넌트가 없습니다. |
| **문제점** | - Spec의 "4. 검색 및 필터 (선택적 기능)" 미구현<br>- 채팅방이 많을 때 사용자 경험 저하 |
| **구현 계획** | **파일**: `src/features/chat-list/components/chat-list-search.tsx` (신규)<br>**내용**:<br>1. 검색 입력 필드 컴포넌트<br>2. debounce 적용하여 성능 최적화<br>3. `useChatListContext`의 `setFilter` 호출<br><br>**파일**: `src/app/chat/page.tsx` 수정<br>- header에 검색 컴포넌트 추가 |

### 6. 스크롤 위치 복원 미구현 (우선순위: 낮음)

| 상태 | 설명 |
|---|---|
| **현재 상태** | Spec 3.2 "채팅방 선택 시 스크롤 위치 저장 및 복원" 미구현 |
| **문제점** | - 채팅방 진입 후 뒤로가기 시 목록 상단으로 이동<br>- 긴 목록에서 불편함 |
| **구현 계획** | **파일**: `src/features/chat-list/context/chat-list-context.tsx`<br>**state 추가**: `scrollPosition: number`<br><br>**파일**: `src/features/chat-list/components/chat-list-panel.tsx`<br>**로직**:<br>1. useEffect로 스크롤 이벤트 리스너 등록<br>2. 스크롤 위치를 context에 저장<br>3. 페이지 재진입 시 저장된 위치로 복원 |

### 7. 가상 스크롤 (Virtual Scroll) 미구현 (우선순위: 낮음)

| 상태 | 설명 |
|---|---|
| **현재 상태** | 모든 채팅방 항목을 렌더링합니다. |
| **문제점** | - 채팅방 100개 이상일 때 렌더링 성능 저하<br>- Spec의 "UI/UX 고려사항 2. 성능 최적화" 미충족 |
| **구현 계획** | **라이브러리**: `react-window` 또는 `@tanstack/react-virtual`<br>**파일**: `src/features/chat-list/components/chat-list-panel.tsx` 수정<br>**내용**:<br>1. 가상 스크롤 컴포넌트로 래핑<br>2. 화면에 보이는 항목만 렌더링 |

### 8. 주석 및 문서화 부족 (우선순위: 중간)

| 상태 | 설명 |
|---|---|
| **현재 상태** | 주요 함수에 JSDoc 주석이 없습니다. |
| **문제점** | - 코드 가독성 저하<br>- 프로덕션 레벨 요구사항 미충족 |
| **구현 계획** | **대상 파일**:<br>- `service.ts`: `getChatRoomsByUserId` 함수<br>- `context.ts`: `chatListReducer`, 각 action<br>- `use-chat-list-query.ts`: `useChatListQuery` 훅<br><br>**내용**:<br>- 함수의 목적, 파라미터, 반환값 설명<br>- 복잡한 로직에 대한 인라인 주석 |

### 9. 앱 백그라운드/포그라운드 처리 미구현 (우선순위: 낮음)

| 상태 | 설명 |
|---|---|
| **현재 상태** | Spec BR-5 "앱이 백그라운드 상태일 때는 Polling 중단" 미구현 |
| **문제점** | - 모바일 환경에서 불필요한 네트워크 요청<br>- 배터리 소모 증가 |
| **구현 계획** | **파일**: `src/features/chat-list/hooks/use-chat-list-query.ts`<br>**로직**:<br>1. `react-use`의 `usePageVisibility` 훅 활용<br>2. 페이지가 hidden 상태일 때 `enabled: false`<br>3. visible 복귀 시 즉시 refetch |

---

## 💡 개선 제안사항

### 1. 에러 코드 세분화
- 현재: `CHAT_LIST/FETCH_ERROR` 하나로 모든 에러 처리
- 제안: DB 에러, 네트워크 에러, 권한 에러 등 세분화하여 사용자에게 구체적인 안내 제공

### 2. 캐시 정책 개선
- 현재: `staleTime: 0` (항상 최신 상태 조회)
- 제안: 초기 조회는 캐시 사용, Polling으로만 갱신하여 네트워크 요청 최소화

### 3. 읽지 않은 메시지 배지 애니메이션
- 새 메시지 도착 시 배지에 부드러운 애니메이션 효과 추가

### 4. 접근성 개선
- Spec의 "UI/UX 고려사항 3. 접근성" 중 ARIA Live Region, Screen Reader 지원 미구현
- `role`, `aria-label`, `aria-live` 속성 추가 필요

### 5. 오프라인 지원
- Spec의 "UI/UX 고려사항 4. 오프라인 지원" 미구현
- Service Worker 또는 React Query의 `networkMode` 활용

---

## 📝 종합 의견

### 전체 구현률: **약 70%**

채팅 목록 조회 유스케이스의 핵심 기능은 대부분 구현되어 있으며, 기본적인 사용자 흐름은 정상 동작합니다. 특히 다음 항목들이 잘 구현되었습니다:

**강점:**
- ✅ API 엔드포인트가 Spec과 완전히 일치
- ✅ 데이터 스키마가 요구사항과 100% 일치
- ✅ Polling 기반 자동 갱신이 React Query로 잘 구현됨
- ✅ 에러 처리 및 빈 상태 UI가 갖춰짐
- ✅ 채팅방 타입별 이름 표시 로직이 정확함
- ✅ Zustand 대신 Context API + useReducer로 상태 관리 (단순한 구조에 적합)

**프로덕션 레벨 미달 사항:**
- ❌ **테스트 코드가 전혀 없음** (가장 큰 문제)
- ❌ N+1 쿼리 문제로 인한 성능 이슈
- ❌ Exponential Backoff 미구현
- ❌ since 파라미터 최적화 부족
- ❌ 주석 및 문서화 부족

**권장 조치:**
1. **즉시 수정 필요 (우선순위 높음)**:
   - 테스트 코드 작성 (최소한 service 레이어)
   - since 파라미터 최적화로 Polling 트래픽 감소
   - 데이터베이스 쿼리 최적화 (N+1 문제 해결)

2. **단기 개선 (1-2주 내)**:
   - Exponential Backoff 구현
   - JSDoc 주석 추가
   - 에러 코드 세분화

3. **중장기 개선 (1개월 내)**:
   - 가상 스크롤 적용 (채팅방 100개 이상 시)
   - 검색 및 필터 UI 추가
   - 접근성 및 오프라인 지원

### 프로덕션 배포 판단:
- **현재 상태**: 기본 기능은 동작하지만 프로덕션 레벨은 아님
- **최소 요구사항**: 테스트 코드 작성 + 쿼리 최적화 후 배포 가능
- **이상적 상태**: 위의 "즉시 수정 필요" + "단기 개선" 항목 완료 후 배포 권장
