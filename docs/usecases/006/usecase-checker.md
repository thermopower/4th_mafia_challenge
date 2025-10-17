# Usecase 구현 상태 점검 보고서

- **점검 일시**: 2025-10-17
- **점검 대상 문서**:
  - spec: docs\usecases\006\spec.md
  - 관련 구현: src\features\chat-room\backend (리액션 기능이 chat-room 기능에 통합됨)

---

## ✅ 구현 완료된 기능

| 기능/페이지 | 관련 코드 파일 | 프로덕션 레벨 충족 여부 | 비고 |
|---|---|---|---|
| **API - 리액션 토글** | `src/features/chat-room/backend/route.ts:173-228` | ⚠️ 부분 충족 | POST /api/messages/:messageId/reactions 엔드포인트 존재, 토글 동작 구현됨 |
| **서비스 로직 - 리액션 토글** | `src/features/chat-room/backend/service.ts:489-614` | ⚠️ 부분 충족 | 권한 확인, 삭제 메시지 체크, 토글 로직 구현됨 |
| **스키마 정의** | `src/features/chat-room/backend/schema.ts:1-161` | ✅ 완전 충족 | Zod 스키마 정의 완료, Reaction/ToggleReactionRequest/ToggleReactionResponse 정의됨 |
| **DB 테이블 - message_reactions** | `supabase/migrations/0002_define_chat_schema.sql:141-149` | ⚠️ 부분 충족 | 복합 PK (message_id, user_id, reaction_type) 정의됨, check constraint 존재 |
| **에러 코드 정의** | `src/features/chat-room/backend/error.ts:1-27` | ✅ 완전 충족 | chatRoomErrorCodes에 필요한 에러 타입 정의됨 |
| **프론트엔드 훅** | `src/features/chat-room/hooks/useToggleReaction.ts` | ⚠️ 부분 충족 | React Query mutation 사용, 낙관적 UI 업데이트 구현 |
| **UI 컴포넌트** | `src/features/chat-room/components/message-bubble.tsx:106-125` | ⚠️ 부분 충족 | 리액션 아이콘 표시, 클릭 핸들러 구현, 시각적 피드백 제공 |
| **DTO 재노출** | `src/features/chat-room/lib/dto.ts` | ✅ 완전 충족 | 백엔드 스키마를 프론트엔드에서 재사용 가능하도록 export |

---

## ❌ 구현되지 않았거나 보완이 필요한 기능

| 기능/페이지 | 상태 | 구현 계획 |
|---|---|---|
| **DELETE 엔드포인트** | ❌ 미구현 | spec.md:254-272에 정의된 `DELETE /api/messages/{messageId}/reactions/{reactionType}` 엔드포인트 없음. 현재는 POST로 토글 방식만 구현 |
| **GET 리액션 목록 조회** | ❌ 미구현 | spec.md:274-297에 정의된 `GET /api/messages/{messageId}/reactions` 엔드포인트 없음. 리액션을 추가한 사용자 목록 조회 불가 |
| **테스트 코드** | ❌ 완전 미구현 | 단위 테스트/통합 테스트 파일 없음 (*.test.ts, *.test.tsx, *.spec.ts 등) |
| **DB 인덱스 최적화** | ⚠️ 부분 구현 | spec.md:192-193에 정의된 `idx_message_reactions_message`, `idx_message_reactions_user` 인덱스 미생성 |
| **에러 메시지 표시 UI** | ⚠️ 불명확 | 삭제된 메시지에 리액션 시도, 권한 없는 사용자의 리액션 시도 등 에러 케이스에 대한 명시적 UI 피드백 로직 불명확 |
| **리액션 사용자 목록 모달** | ❌ 미구현 | spec.md:166-169 (UX5)에 정의된 리액션 카운트 클릭 시 사용자 목록 표시 기능 없음 |
| **낙관적 UI 롤백** | ⚠️ 불명확 | useToggleReaction에서 onError 핸들러 미구현, 실패 시 이전 상태 복원 로직 없음 |
| **중복 클릭 방지** | ⚠️ 불명확 | 클라이언트에서 요청 중 상태 관리 및 버튼 비활성화 로직 불명확 |
| **주석 및 문서화** | ⚠️ 부족 | 주요 함수에 JSDoc 주석 부족, 특히 toggleReaction 서비스 함수 등 |

---

## 📝 종합 의견

### 긍정적 측면

1. **핵심 기능 구현 완료**: 리액션 토글의 핵심 로직(추가/제거)이 백엔드에 정상 구현되어 있으며, 토글 방식으로 멱등성이 보장됩니다.
2. **권한 검증 철저**: 채팅방 멤버십 확인, 삭제된 메시지 확인 등 필수 비즈니스 로직이 구현되어 있습니다.
3. **타입 안정성**: Zod 스키마로 요청/응답 검증이 이루어지며, TypeScript로 타입 안정성을 확보하고 있습니다.
4. **UI 연동**: React Query를 사용한 프론트엔드 훅과 MessageBubble 컴포넌트에서 리액션 표시 및 클릭 이벤트가 구현되어 있습니다.

### 개선 필요 사항

1. **프로덕션 레벨 미달**:
   - **테스트 코드 전무**: 단위/통합 테스트가 전혀 없어 프로덕션 배포 시 리스크가 큽니다.
   - **에러 핸들링 불완전**: 프론트엔드에서 onError 핸들러, 낙관적 UI 롤백, 사용자 피드백 메시지 등이 명확히 구현되어 있지 않습니다.

2. **Spec 불일치**:
   - **DELETE 엔드포인트 미구현**: spec에는 별도의 DELETE 엔드포인트가 정의되어 있으나 실제 구현에서는 POST 토글만 제공합니다.
   - **GET 리액션 목록 조회 미구현**: 리액션을 누른 사용자 목록을 조회하는 엔드포인트가 없습니다.

3. **성능 최적화 부족**:
   - **인덱스 누락**: `message_reactions` 테이블에 `message_id`, `user_id` 컬럼에 대한 개별 인덱스가 없어 조회 성능이 저하될 수 있습니다.
   - **N+1 문제**: `getMessageReactions` 함수가 메시지마다 개별 쿼리를 실행하므로, 여러 메시지 조회 시 성능 이슈가 발생할 수 있습니다.

4. **UX 세부 사항 미구현**:
   - 리액션 사용자 목록 모달
   - 중복 클릭 방지 로직
   - 에러 케이스별 명확한 사용자 피드백

5. **문서화 부족**: 주요 함수와 로직에 대한 JSDoc 주석이 거의 없어 유지보수성이 낮습니다.

### 권장 사항

**우선순위 1 (필수)**:
1. 테스트 코드 작성 (특히 toggleReaction 서비스 함수)
2. 프론트엔드 에러 핸들링 보완 (onError, 롤백 로직, 토스트 메시지)
3. DB 인덱스 추가 (`CREATE INDEX idx_message_reactions_message ON message_reactions(message_id)`, `CREATE INDEX idx_message_reactions_user ON message_reactions(user_id)`)

**우선순위 2 (중요)**:
4. GET 리액션 목록 조회 엔드포인트 구현
5. N+1 쿼리 최적화 (배치 조회 또는 JOIN 활용)
6. 주요 함수 JSDoc 주석 추가

**우선순위 3 (개선)**:
7. 리액션 사용자 목록 모달 UI 구현
8. 중복 클릭 방지 로직 명확화
9. DELETE 엔드포인트 구현 (spec 일치 여부에 따라 선택)

---

## 구현 필요 항목 상세

### 1. 테스트 코드 (필수)

**파일 경로**: `src/features/chat-room/backend/service.test.ts`

**필요 테스트 케이스**:
- 정상 흐름: 리액션 추가 성공
- 정상 흐름: 리액션 제거 성공 (토글)
- 에러 케이스: 삭제된 메시지에 리액션 시도
- 에러 케이스: 권한 없는 사용자
- 에러 케이스: 존재하지 않는 메시지
- Edge Case: 동시 리액션 요청 처리

### 2. 프론트엔드 에러 핸들링 (필수)

**파일 경로**: `src/features/chat-room/hooks/useToggleReaction.ts`

**구현 내용**:
```typescript
return useMutation({
  mutationFn: async (request: ToggleReactionRequest) => { ... },
  onMutate: async (request) => {
    // 낙관적 업데이트 로직
    // 기존 상태 스냅샷 저장
  },
  onError: (error, request, context) => {
    // 이전 상태로 롤백
    // 사용자에게 에러 토스트 표시
  },
  onSuccess: (data) => { ... },
});
```

### 3. DB 인덱스 추가 (필수)

**파일 경로**: `supabase/migrations/0003_add_message_reactions_indexes.sql`

**내용**:
```sql
CREATE INDEX IF NOT EXISTS idx_message_reactions_message
ON message_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_user
ON message_reactions(user_id);
```

### 4. GET 리액션 목록 조회 엔드포인트 (중요)

**파일 경로**: `src/features/chat-room/backend/route.ts`, `service.ts`

**엔드포인트**: `GET /api/messages/:messageId/reactions`

**응답 형식** (spec.md:274-297):
```json
{
  "success": true,
  "data": {
    "reactions": [
      {
        "type": "like",
        "count": 5,
        "users": [
          {
            "userId": "uuid",
            "nickname": "김민준",
            "profileImageUrl": "https://picsum.photos/200"
          }
        ]
      }
    ]
  }
}
```

**함수 역할**:
- `getReactionUsers(client, messageId)`: 메시지의 모든 리액션과 사용자 정보 조회
