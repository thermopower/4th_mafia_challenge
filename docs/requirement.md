# **1. 개요 (Overview)**

*   **1.1. 배경 및 문제 정의**
    *   사용자들은 개인적인 소통, 학업, 업무 등 다양한 목적을 위해 여러 그룹 및 개인과 실시간으로 소통할 필요가 있다.
    *   기존 메신저들은 기능이 과도하게 복잡하거나, 특정 플랫폼에 종속되어 있어 가볍고 범용적인 소통 도구에 대한 니즈가 존재한다.

*   **1.2. 목표**
    *   사용자가 손쉽게 1:1 및 그룹 채팅방을 생성하고 참여할 수 있는 직관적인 채팅 서비스 개발을 목표로 한다.
    *   텍스트, 이모지 전송 등 기본적인 메시징 기능과 함께 '좋아요', '답장', '삭제'와 같은 핵심 상호작용 기능을 제공하여 원활한 커뮤니케이션 경험을 제공한다.
    *   안정적이고 확장 가능한 데이터 구조를 설계하여 향후 기능 추가에 유연하게 대응할 수 있는 기반을 마련한다.

*   **1.3. 타겟 사용자**
    *   소규모 팀 프로젝트를 진행하는 학생 및 직장인
    *   동호회, 스터디 등 특정 목적을 가진 그룹의 구성원
    *   지인들과 빠르고 간편하게 소통하고자 하는 일반 사용자

# **2. 기능 요구사항 (Functional Requirements)**

*   **2.1. 사용자 관리**
    *   **FR-U01:** 사용자는 이메일과 비밀번호, 닉네임을 이용해 회원가입할 수 있어야 한다.
    *   **FR-U02:** 가입된 사용자는 이메일과 비밀번호를 통해 로그인할 수 있어야 한다.

*   **2.2. 채팅방 관리**
    *   **FR-R01:** 사용자는 대화할 상대를 1명 이상 선택하여 새로운 채팅을 시작할 수 있어야 한다.
    *   **FR-R02:** 대화 상대를 1명 선택하면 별도의 이름 설정 없이 즉시 1:1 채팅방이 개설되어야 한다.
    *   **FR-R03:** 대화 상대를 2명 이상 선택하면 그룹 채팅방이 되며, 사용자는 채팅방의 이름을 설정할 수 있어야 한다.
    *   **FR-R04:** 사용자는 자신이 참여하고 있는 모든 채팅방의 목록을 볼 수 있어야 한다.
    *   **FR-R05:** 채팅방 목록에서는 각 방의 마지막 메시지와 시간이 표시되어야 한다.

*   **2.3. 메시징 기능**
    *   **FR-M01:** 사용자는 채팅방 내에서 텍스트 메시지를 전송하고 실시간으로 수신할 수 있어야 한다.
    *   **FR-M02:** 사용자는 시스템에 내장된 이모지를 메시지로 전송할 수 있어야 한다.
    *   **FR-M03:** 특정 메시지를 지정하여 답장 메시지를 보낼 수 있어야 하며, 답장 메시지는 원본 메시지와 시각적으로 연결되어 표시되어야 한다.
    *   **FR-M04:** 다른 사용자가 보낸 메시지에 '좋아요' 와 같은 감정 표현(Reaction)을 남길 수 있어야 한다.
    *   **FR-M05:** 사용자는 **자신이 보낸 메시지**에 한해 삭제할 수 있어야 하며, 삭제 시 다른 참여자들에게는 "삭제된 메시지입니다" 와 같이 표시되어야 한다.

# **3. 데이터 요구사항 (Data Requirements)**

## **3.1. 데이터 정의 (Entity Definition)**

| 엔티티 (Entity) | 속성 (Attribute) | 데이터 타입 | 설명 |
| :--- | :--- | :--- | :--- |
| **User** | `user_id` (PK) | Integer | 사용자 고유 식별자 |
| | `email` | String | 로그인 ID로 사용 (Unique) |
| | `password` | String | 해시(Hash) 처리하여 저장 |
| | `nickname` | String | 앱 내에서 표시될 이름 |
| | `created_at` | Timestamp | 계정 생성 시각 |
| **ChatRoom** | `room_id` (PK) | Integer | 채팅방 고유 식별자 |
| | `room_name` | String | 그룹 채팅방의 이름 (1:1은 NULL) |
| | `type` | Enum | 'ONE_TO_ONE', 'GROUP' |
| | `created_at` | Timestamp | 채팅방 생성 시각 |
| **Participant** | `participant_id` (PK) | Integer | 참여 정보 고유 식별자 |
| (참여 정보) | `user_id` (FK) | Integer | 참여한 사용자의 ID |
| | `room_id` (FK) | Integer | 참여한 채팅방의 ID |
| | `joined_at` | Timestamp | 채팅방 참여 시각 |
| **Message** | `message_id` (PK) | Integer | 메시지 고유 식별자 |
| | `room_id` (FK) | Integer | 메시지가 속한 채팅방 ID |
| | `sender_id` (FK) | Integer | 메시지를 보낸 사용자 ID |
| | `content` | Text | 메시지 내용 (텍스트/이모지) |
| | `reply_to_message_id` (FK) | Integer | 답장한 원본 메시지 ID (NULL 가능) |
| | `is_deleted` | Boolean | 삭제 여부 (기본값: false) |
| | `created_at` | Timestamp | 메시지 생성 시각 |
| **Reaction** | `reaction_id` (PK) | Integer | '좋아요' 고유 식별자 |
| ('좋아요') | `message_id` (FK) | Integer | '좋아요'를 받은 메시지 ID |
| | `user_id` (FK) | Integer | '좋아요'를 누른 사용자 ID |
| | `type` | Enum | 'LIKE' 등 (확장성 고려) |
| | `created_at` | Timestamp | '좋아요' 생성 시각 |

## **3.2. 데이터 흐름 (Data Flow)**

*   **DF-01: 그룹 채팅방 생성 흐름**
    1.  **Client:** 사용자 A가 사용자 B, C를 대화 상대로 선택하고 '프로젝트 회의'라는 이름으로 채팅방 생성을 요청한다.
    2.  **Server:**
        a. `ChatRoom` 테이블에 `room_name`='프로젝트 회의', `type`='GROUP'으로 새로운 row를 INSERT한다.
        b. 생성된 `room_id`를 가져온다.
        c. `Participant` 테이블에 (user_id: A, room_id), (user_id: B, room_id), (user_id: C, room_id) 3개의 row를 INSERT한다.
    3.  **Server → Client:** 생성 성공 응답과 함께 `room_id`를 전달하고, 참여자들의 클라이언트에 새로운 채팅방이 생겼음을 알린다.

*   **DF-02: 메시지 전송 및 실시간 수신 흐름**
    1.  **Client (Sender A):** 채팅방(`room_id`: 10)에서 "안녕하세요" 메시지 전송을 요청한다. (Data: `room_id`, `sender_id`, `content`)
    2.  **Server (via WebSocket):**
        a. `Message` 테이블에 (`room_id`: 10, `sender_id`: A, `content`: "안녕하세요") row를 INSERT한다.
        b. `Participant` 테이블에서 `room_id`가 10인 모든 `user_id` (A, B, C)를 조회한다.
        c. 조회된 모든 사용자(B, C)의 클라이언트로 새로운 메시지 데이터를 실시간 Push한다. (자신에게는 확인 응답 전송)
    3.  **Client (Receivers B, C):** Push 받은 메시지 데이터를 화면의 메시지 목록에 추가한다.

*   **DF-03: 메시지 답장 흐름**
    1.  **Client:** 사용자 B가 `message_id`: 123인 메시지를 선택하고 "이 의견 좋습니다"라는 답장을 전송 요청한다. (Data: `room_id`, `sender_id`, `content`, `reply_to_message_id`: 123)
    2.  **Server:**
        a. `Message` 테이블에 `reply_to_message_id`가 123으로 채워진 새로운 메시지를 INSERT한다.
        b. 해당 채팅방의 모든 참여자에게 이 메시지를 Push한다.
    3.  **Client:** 답장 메시지를 수신하고, UI에서 `reply_to_message_id`를 이용해 원본 메시지와 시각적으로 연결하여 렌더링한다.

*   **DF-04: 내 메시지 삭제 흐름**
    1.  **Client:** 사용자 A가 자신이 보낸 `message_id`: 125 메시지의 삭제를 요청한다.
    2.  **Server:**
        a. `Message` 테이블에서 `message_id`가 125인 row를 조회하여 `sender_id`가 요청한 사용자 A와 일치하는지 검증한다.
        b. 검증 성공 시, 해당 row의 `is_deleted` 값을 `true`로 UPDATE 하고, `content`를 비운다.
        c. 해당 채팅방 모든 참여자에게 `message_id`: 125가 삭제 처리되었음을 알린다.
    3.  **Client:** 해당 메시지 ID의 내용을 "삭제된 메시지입니다"로 변경하여 표시한다.