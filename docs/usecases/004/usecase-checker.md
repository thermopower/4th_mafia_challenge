# Usecase 004 구현 상태 점검 보고서

- **점검 일시**: 2025-10-17
- **점검 대상 문서**:
  - spec: `docs/usecases/004/spec.md`
  - 구현 위치: `src/features/chat-room/` (메시지 기능이 chat-room 기능에 통합 구현됨)

---

## ✅ 구현 완료된 기능

### 1. API 엔드포인트 및 메서드

| 기능 | Spec 정의 | 실제 구현 | 일치 여부 | 비고 |
|---|---|---|---|---|
| 메시지 전송 | `POST /api/messages` | `POST /api/messages` | ✅ 일치 | route.ts:132 |
| 초기 메시지 로드 | 미정의 | `GET /api/chat-rooms/:roomId/messages` | ✅ 구현됨 | route.ts:29, 무한 스크롤 지원 |
| Polling 동기화 | `GET /api/messages?chatRoomId={id}&since={lastMessageId}` | `GET /api/chat-rooms/:roomId/messages/sync?afterTimestamp={timestamp}` | ⚠️ 부분 일치 | route.ts:76, 파라미터명 다름 (messageId→timestamp) |
| 리액션 토글 | 미정의 | `POST /api/messages/:messageId/reactions` | ✅ 추가 구현 | route.ts:173 |
| 메시지 삭제 | 미정의 | `DELETE /api/messages/:messageId` | ✅ 추가 구현 | route.ts:231 |
| 읽음 상태 업데이트 | 미정의 | `POST /api/chat-rooms/:roomId/read` | ✅ 추가 구현 | route.ts:269 |

**결론**: 핵심 API는 모두 구현되었으며, spec에 정의되지 않은 추가 기능(리액션, 삭제, 읽음 상태)도 구현되어 있음.

---

### 2. 요청/응답 데이터 구조

| 항목 | Spec 정의 | 실제 구현 | 일치 여부 | 비고 |
|---|---|---|---|---|
| SendMessageRequest | chatRoomId, messageType, content, replyToMessageId, clientMessageId, attachments | 동일 | ✅ 완전 일치 | schema.ts:78-93 |
| Message 응답 | id, chatRoomId, senderId, sender, messageType, content, replyToMessageId, replyTo, isDeleted, deletedAt, reactions, attachments, createdAt, updatedAt | 동일 | ✅ 완전 일치 | schema.ts:33-48 |
| Polling 응답 | spec: `{messages: [...]}` / 실제: `{newMessages, updatedMessages, deletedMessageIds}` | ⚠️ 구조 다름 | ✅ 개선됨 | schema.ts:69-75, 더 세분화된 응답 |

**결론**: 요청/응답 스키마가 spec과 일치하거나 더 개선된 형태로 구현됨. Zod 스키마로 타입 안전성 확보.

---

### 3. 비즈니스 로직

#### 3.1 메시지 저장
- ✅ **트랜잭션**: 메시지와 첨부파일을 순차적으로 삽입 (service.ts:429-476)
- ✅ **권한 확인**: `checkMembership`으로 채팅방 참여 여부 검증 (service.ts:380-390)
- ✅ **답장 검증**: replyToMessageId 존재 여부 확인 (service.ts:412-426)
- ✅ **메시지 타입**: text, emoji, file, system 지원 (schema.ts:4)
- ✅ **발신자 정보**: sender 정보를 조인하여 반환 (service.ts:439-442)

#### 3.2 첨부파일 처리
- ✅ **첨부파일 저장**: `message_attachments` 테이블에 저장 (service.ts:456-476)
- ✅ **첨부파일 조회**: `getMessageAttachments` 헬퍼로 메시지별 첨부파일 조회 (service.ts:98-117)
- ⚠️ **파일 업로드**: 파일 업로드 자체는 클라이언트에서 사전 처리 (spec의 "먼저 파일 업로드를 수행한다"와 일치)

#### 3.3 멱등성 보장
- ⚠️ **부분 구현**: spec에서는 `clientMessageId` 기반 멱등성 체크를 명시했으나, 실제로는 **content + sender + chatRoomId + 1분 이내** 조건으로 중복 확인 (service.ts:394-408)
- ⚠️ **개선 필요**: spec의 `clientMessageId` 기반 멱등성 체크가 구현되지 않음
- ✅ **중복 응답**: 중복 감지 시 409 에러 반환 (service.ts:404-408)

**결론**: 핵심 비즈니스 로직은 구현되었으나, **멱등성 보장 방식이 spec과 다름**. `clientMessageId` 기반 멱등성이 구현되지 않아 네트워크 재시도 시 중복 전송 가능.

---

### 4. Polling 기반 실시간 동기화

| 기능 | Spec 정의 | 실제 구현 | 일치 여부 | 비고 |
|---|---|---|---|---|
| Polling 주기 | 기본 3초 | 3초 (POLLING_INTERVAL: 3000) | ✅ 일치 | constants/index.ts:2 |
| 신규 메시지 조회 | since 파라미터 기반 | afterTimestamp 기반 | ⚠️ 다름 | service.ts:303-328, 타임스탬프 방식이 더 정확 |
| 변경/삭제 메시지 | 미정의 | updatedMessages, deletedMessageIds 반환 | ✅ 추가 구현 | service.ts:331-368 |
| React Query 통합 | 미정의 | useMessagesSync 훅으로 자동 polling | ✅ 구현됨 | hooks/useMessagesSync.ts:17-45 |

**결론**: Polling 로직이 완전히 구현되었으며, spec보다 더 정교함 (변경/삭제 메시지도 동기화).

---

### 5. 에러 처리 및 예외 케이스

| Edge Case | Spec 정의 | 실제 구현 | 일치 여부 | 비고 |
|---|---|---|---|---|
| 네트워크 단절 | 로컬 스토리지 임시 저장, 재전송 옵션 | ⚠️ 부분 구현 | ⚠️ 부족 | pending 메시지 관리는 있으나 로컬 스토리지 저장 없음 (reducer.ts:140-171) |
| 중복 전송 방지 | clientMessageId 기반 | content 기반 (1분 이내) | ❌ 불일치 | service.ts:394-408 |
| 파일 업로드 실패 | 메시지 전송 중단, 텍스트 보존 | 미구현 | ❌ 누락 | 파일 업로드 로직 자체가 별도 구현 필요 |
| 권한 상실 (403) | 메시지 실패 처리, 채팅방 이탈 | ✅ 구현 | ✅ 일치 | service.ts:385-390 |
| 채팅방 삭제 (404) | 404 응답, 채팅방 목록 이동 | ✅ 구현 | ✅ 일치 | route.ts:34-46 (roomId 검증) |
| 검증 실패 (400) | 구체적 오류 사유 반환 | ✅ 구현 | ✅ 일치 | route.ts:144-153, Zod 에러 포함 |
| 서버 오류 (5xx) | 일시적 오류 안내, 재시도 옵션 | ✅ 구현 | ✅ 일치 | error.ts:18-22 |

**에러 코드 정의**:
- ✅ 권한 관련: `CHAT_ROOM_NOT_MEMBER`, `CHAT_ROOM_NOT_AUTHORIZED` (error.ts:3-4)
- ✅ 리소스 관련: `CHAT_ROOM_NOT_FOUND`, `MESSAGE_NOT_FOUND` (error.ts:7-8)
- ✅ 중복 방지: `DUPLICATE_MESSAGE` (error.ts:11)
- ✅ 데이터베이스 오류: `FETCH_ERROR`, `INSERT_ERROR`, `UPDATE_ERROR`, `DELETE_ERROR` (error.ts:18-22)

**결론**: 기본 에러 처리는 구현되었으나, **네트워크 재연결 시나리오와 파일 업로드 실패 처리**가 부족함.

---

### 6. 데이터베이스 스키마

| 테이블 | Spec 정의 | 실제 구현 | 일치 여부 | 비고 |
|---|---|---|---|---|
| messages | id, chat_room_id, sender_id, message_type, content, reply_to_message_id, is_deleted, deleted_at, created_at, updated_at | 동일 | ✅ 완전 일치 | 0002_define_chat_schema.sql:68-85 |
| message_attachments | id, message_id, file_url, file_type, file_size_bytes, created_at, updated_at | 동일 | ✅ 완전 일치 | 0002_define_chat_schema.sql:129-138 |
| message_reactions | 미정의 | message_id, user_id, reaction_type (PK: 복합키) | ✅ 추가 구현 | 0002_define_chat_schema.sql:141-149 |
| 인덱스 | idx_messages_chat_room_created | idx_messages_room_created_at | ✅ 일치 | 0002_define_chat_schema.sql:88-90 |

**제약 조건**:
- ✅ message_type CHECK: text, emoji, file, system (0002_define_chat_schema.sql:72)
- ✅ content NOT NULL 조건: message_type별 content 필수 여부 검증 (0002_define_chat_schema.sql:79-82)
- ✅ reply_to_message_id FK: self-referencing foreign key (0002_define_chat_schema.sql:83)
- ✅ updated_at 트리거: 모든 테이블에 자동 업데이트 (0002_define_chat_schema.sql:180-186)

**결론**: 데이터베이스 스키마가 spec과 완전히 일치하며, 추가 기능(리액션)도 잘 정의됨.

---

### 7. 프론트엔드 구현

#### 7.1 낙관적 UI 업데이트
- ✅ **Pending 메시지**: `MESSAGES/ADD_PENDING` 액션으로 전송 중 메시지 즉시 표시 (hooks/useSendMessage.ts:28-36)
- ✅ **서버 응답 후 교체**: `MESSAGES/ACK_PENDING`로 실제 메시지로 교체 (hooks/useSendMessage.ts:43-52)
- ✅ **상태 표시**: sending, failed 상태 관리 (reducer.ts:140-171)

#### 7.2 에러 처리
- ✅ **전송 실패 표시**: `MESSAGES/FAIL_PENDING`으로 실패 상태 및 에러 메시지 저장 (hooks/useSendMessage.ts:63-70)
- ✅ **API 에러 추출**: `extractApiErrorMessage` 헬퍼로 일관된 에러 메시지 표시 (hooks/useSendMessage.ts:68)
- ⚠️ **재전송 버튼**: UI에 재전송 버튼 구현 필요 (현재 pending 관리만 됨)

#### 7.3 입력 편의성
- ✅ **Enter 키 전송**: Shift+Enter는 줄바꿈 (message-composer.tsx:30-35)
- ✅ **답장 UI**: 답장 대상 미리보기 및 취소 버튼 (message-composer.tsx:37-60)
- ✅ **전송 버튼 비활성화**: 빈 메시지일 때 비활성화 (message-composer.tsx:75)
- ⚠️ **파일 드래그 앤 드롭**: 미구현

#### 7.4 스크롤 동작
- ✅ **스크롤 유틸**: `scroll-utils.ts`로 자동 스크롤 로직 구현
- ✅ **무한 스크롤**: `useMessagesQuery`로 이전 메시지 로드 지원
- ⚠️ **신규 메시지 알림**: 스크롤 유지 시 신규 메시지 배지 표시 미구현

#### 7.5 Context 및 상태 관리
- ✅ **ChatRoomProvider**: 채팅방 전역 상태 관리 (contexts/chat-room-provider.tsx)
- ✅ **Reducer 패턴**: 복잡한 상태 변경을 reducer로 관리 (contexts/reducer.ts)
- ✅ **React Query 통합**: 서버 상태와 로컬 상태 분리

**결론**: 프론트엔드 핵심 기능은 잘 구현되었으나, **파일 업로드, 재전송 UI, 신규 메시지 알림 배지**가 누락됨.

---

## ❌ 구현되지 않았거나 보완이 필요한 기능

| 기능/페이지 | 상태 | 구현 계획 |
|---|---|---|
| **clientMessageId 기반 멱등성** | ❌ 미구현 | `service.ts`의 중복 확인 로직을 clientMessageId 기반으로 변경. 별도 테이블(또는 Redis 캐시)에 clientMessageId를 24시간 저장하여 중복 요청 차단. |
| **파일 업로드 기능** | ❌ 미구현 | 1. Supabase Storage 연동 (`/api/upload` 엔드포인트 추가)<br>2. `MessageComposer`에 파일 선택 및 드래그 앤 드롭 UI 추가<br>3. 업로드 진행률 표시 및 실패 처리 |
| **네트워크 재연결 시 재전송** | ⚠️ 부분 구현 | 1. pending 메시지를 localStorage에 저장<br>2. 페이지 리로드 시 복원 및 자동 재전송<br>3. 네트워크 상태 감지 후 자동 재시도 |
| **전송 실패 메시지 재전송 UI** | ❌ 미구현 | `MessageBubble`에서 pending 메시지 중 `status: 'failed'`인 경우 재전송 버튼 표시. 버튼 클릭 시 `useSendMessage` 재호출. |
| **Rate Limiting (속도 제한)** | ❌ 미구현 | Hono 미들웨어로 IP/userId 기반 rate limiter 추가. 초당 5개, 분당 30개 제한 (spec BR-7). Redis나 in-memory store 활용. |
| **금지 패턴 검증 (욕설 필터)** | ❌ 미구현 | 1. `service.ts`의 `sendMessage`에서 금지어 사전 검증<br>2. 외부 API 또는 정규식 기반 필터링 추가<br>3. 검증 실패 시 400 에러 반환 |
| **신규 메시지 알림 배지** | ❌ 미구현 | 1. `message-timeline.tsx`에서 스크롤 위치 감지<br>2. 하단이 아닌 경우 신규 메시지 개수 표시<br>3. 배지 클릭 시 최하단 스크롤 |
| **메시지 길이 제한 (클라이언트)** | ⚠️ 부분 구현 | `MessageComposer`에서 10,000자 초과 시 경고 메시지 표시 및 전송 버튼 비활성화 (현재는 서버 검증만 있음). |
| **파일 크기 및 형식 제한** | ❌ 미구현 | 1. 클라이언트에서 파일 선택 시 크기(50MB) 및 형식 검증<br>2. spec BR-3에 따라 최대 5개 파일, 총 100MB 제한<br>3. 검증 실패 시 사용자 친화적 오류 메시지 |
| **Polling 주기 최적화** | ⚠️ 부분 구현 | spec의 "메시지 전송 직후 1초 간격, 백그라운드 10초 간격" 로직 미구현. 현재는 고정 3초. `useMessagesSync`에서 조건부 refetchInterval 적용 필요. |
| **임시 저장 및 복원 (로컬 스토리지)** | ❌ 미구현 | 1. `MessageComposer`에서 5초마다 draft를 localStorage에 저장<br>2. 컴포넌트 마운트 시 복원<br>3. 전송 성공 시 삭제 |

---

## 📝 종합 의견

### 전반적인 구현 상태
**프로덕션 레벨 달성률: 약 75%**

#### 강점
1. **핵심 기능 완성도**: 메시지 전송, 조회, Polling 동기화 등 핵심 기능이 안정적으로 구현됨.
2. **타입 안전성**: Zod 스키마로 요청/응답 검증 및 타입 추론이 완벽하게 구현됨.
3. **확장성**: spec에 없던 리액션, 삭제, 읽음 상태 기능까지 추가 구현됨.
4. **에러 처리**: 체계적인 에러 코드 정의 및 핸들링이 구현됨.
5. **프론트엔드 아키텍처**: Context + Reducer + React Query 조합으로 깔끔한 상태 관리.

#### 개선 필요 사항
1. **멱등성 보장**: spec에서 명시한 `clientMessageId` 기반 멱등성이 구현되지 않음. 현재 방식은 동일 내용의 메시지를 1분 내에 재전송하는 경우만 차단하므로, 네트워크 재시도 시 중복 전송 가능성 있음.
2. **파일 업로드**: 파일 첨부 기능의 전체 플로우(업로드 → 저장 → 표시)가 미구현.
3. **Rate Limiting**: 스팸 방지를 위한 속도 제한이 없음 (spec BR-7).
4. **금지 패턴 검증**: 욕설 필터 등 컨텐츠 정책 검증이 없음 (spec BR-4).
5. **네트워크 복원력**: 네트워크 단절 시 메시지 보존 및 자동 재전송이 부족함.

### 프로덕션 배포 전 필수 작업
1. **멱등성 보장 개선** (Critical): clientMessageId 기반 중복 방지 구현.
2. **파일 업로드 구현** (High): Supabase Storage 연동 및 UI 구현.
3. **Rate Limiting 추가** (High): 스팸 공격 방지.
4. **에러 복원 강화** (Medium): 로컬 스토리지 기반 재전송 로직.
5. **UX 개선** (Medium): 신규 메시지 알림, 재전송 버튼, 입력 길이 제한 등.

### 테스트 코드
- ❌ **단위 테스트**: 없음
- ❌ **통합 테스트**: 없음
- ❌ **E2E 테스트**: 없음

**권장 사항**: 핵심 service 로직(`sendMessage`, `syncMessages`)에 대한 단위 테스트를 우선 작성하고, React Query 훅에 대한 통합 테스트를 추가할 것.

---

## 결론

메시지 전송 유스케이스의 **핵심 기능은 안정적으로 구현**되었으나, **멱등성 보장, 파일 업로드, Rate Limiting** 등 프로덕션 환경에서 필수적인 기능들이 누락되어 있습니다. spec과 비교했을 때 약 75% 수준의 완성도이며, 위에 명시된 개선 사항들을 구현한 후 배포하는 것을 권장합니다.

특히 **clientMessageId 기반 멱등성**은 중복 전송을 방지하는 핵심 메커니즘이므로, 최우선으로 구현해야 합니다.
