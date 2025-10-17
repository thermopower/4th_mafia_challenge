# 데이터베이스 데이터플로우 및 스키마

## 데이터플로우 요약
1. **회원가입**: 사용자가 이메일·비밀번호·닉네임·필수 동의를 제출하면 계정 중복과 상태를 검사하고, 비밀번호 해시·기본 프로필 이미지를 포함한 사용자 레코드를 생성한 뒤 초기 세션을 발급한다.
2. **로그인**: 이메일과 비밀번호를 검증해 계정 상태, 실패 횟수, MFA 요구 조건을 확인하고, 성공 시 세션/토큰을 저장하며 실패 시 카운트를 누적한다.
3. **새 채팅 생성**: 선택된 참여자의 유효성을 확인하고 1:1 조합은 기존 방 재사용 여부를 점검, 신규 방일 경우 채팅방 정보와 참여자 목록을 동시에 생성한다.
4. **메시지 전송**: 채팅방 참여 권한을 확인한 뒤 텍스트·이모지·파일 유형 메시지를 저장하고, 파일 첨부 메타데이터를 별도 테이블에 기록한다.
5. **메시지 답장**: 원본 메시지 존재 여부와 접근 권한을 확인하고 답장 메시지를 저장한 후, 이후 동기화 응답에 답장 관계를 포함한다.
6. **메시지 리액션**: 선택된 리액션이 중복되지 않도록 메시지·사용자 조합을 확인하고, 리액션 테이블에 추가하거나 해제한다.
7. **메시지 삭제**: 발신자가 맞는지 검증 후 삭제 플래그와 시간을 갱신하여 본문/첨부 노출을 차단하고 다른 참여자에게 동일 상태를 전달한다.
8. **채팅 목록 조회**: 사용자가 속한 채팅방을 불러오고 최신 메시지, 읽지 않은 개수, 최근 리액션 요약을 합산해 목록을 갱신한다.
9. **채팅방 진입 및 동기화**: 진입 시 권한과 마지막 메시지 기준을 확인하고, 메시지/첨부/리액션을 시간 순으로 내려주며 읽음 정보와 최신 상태를 polling으로 동기화한다.

## 스키마 정의
### users
- **목적**: 회원가입·로그인 흐름에 필요한 계정 기본 정보와 상태를 관리한다.
- **주요 컬럼**
  - `id`: `uuid`, 기본 키.
  - `email`: `text`, 고유, 소문자 비교 인덱스.
  - `password_hash`: `text`, 비밀번호 해시.
  - `nickname`: `varchar(50)`, 노출용 이름.
  - `profile_image_url`: `text`, 기본 프로필 이미지 URL(유효한 `picsum.photos`).
  - `account_status`: `text`, `active/inactive/suspended/withdrawn`.
  - `login_fail_count`: `integer`, 로그인 실패 누적.
  - `terms_agreed_at`: `timestamptz`, 필수 약관 동의 시각.
  - `mfa_required`: `boolean`, MFA 요구 여부.
  - `created_at`, `updated_at`: `timestamptz`, 트리거로 자동 갱신.
- **제약 및 인덱스**: 이메일 소문자 기준 고유 인덱스, 상태 체크 제약.

### user_sessions
- **목적**: 로그인 성공 시 발급되는 세션/리프레시 토큰을 관리한다.
- **주요 컬럼**: `id`, `user_id`, `refresh_token`, `expires_at`, `created_at`, `last_seen_at`, `revoked_at`, `updated_at`.
- **제약 및 인덱스**: `refresh_token` 고유, `user_id`는 `users` 참조, 업데이트 트리거 적용.

### chat_rooms
- **목적**: 1:1 및 그룹 채팅방 메타데이터 보관.
- **주요 컬럼**: `id`, `room_type`(`direct/group`), `name`, `created_by`, `created_at`, `updated_at`.
- **제약**: `created_by`는 `users` 참조, room_type 체크.

### chat_direct_pairs
- **목적**: 1:1 채팅방의 사용자 쌍을 고유하게 관리하여 중복 생성을 방지한다.
- **주요 컬럼**: `chat_room_id`, `user_a_id`, `user_b_id`, `created_at`, `updated_at`.
- **제약 및 인덱스**: `chat_room_id` 기본 키, 사용자 쌍 정렬 고유 인덱스, 사용자 중복 방지 체크.

### chat_members
- **목적**: 채팅방별 참여자를 관리하고 읽음 정보를 저장한다.
- **주요 컬럼**: `id`, `chat_room_id`, `user_id`, `joined_at`, `last_read_message_id`, `last_read_at`, `created_at`, `updated_at`.
- **제약 및 인덱스**: `(chat_room_id, user_id)` 고유, `last_read_message_id`는 `messages` 참조, 사용자 기준 조회 인덱스.

### messages
- **목적**: 채팅방 내 메시지와 답장/삭제 상태를 저장한다.
- **주요 컬럼**: `id`, `chat_room_id`, `sender_id`, `message_type`(`text/emoji/file/system`), `content`, `reply_to_message_id`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`.
- **제약 및 인덱스**: 타입·본문 체크, 자기참조 외래 키, 채팅방/작성시각 복합 인덱스.

### message_attachments
- **목적**: 파일 첨부의 경로와 메타데이터 저장.
- **주요 컬럼**: `id`, `message_id`, `file_url`, `file_type`, `file_size_bytes`, `created_at`, `updated_at`.
- **제약**: `message_id`는 `messages` 참조.

### message_reactions
- **목적**: 메시지별 리액션 상태를 관리하고 중복 입력을 막는다.
- **주요 컬럼**: `message_id`, `user_id`, `reaction_type`(`like/bookmark/empathy`), `created_at`, `updated_at`.
- **제약**: 복합 기본 키, 메시지·사용자 외래 키, 리액션 타입 체크.

## 트리거 및 공통 구성
- `public.set_updated_at` 트리거 함수가 모든 테이블의 `updated_at` 값을 자동으로 갱신한다.
- 모든 테이블은 RLS를 비활성화하여 명시적으로 접근 제어를 구현한다.
- UUID 기본 키 생성을 위해 `pgcrypto` 확장을 사용한다.
