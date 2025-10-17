import { z } from 'zod';

// ===== 공통 스키마 =====
export const MessageTypeSchema = z.enum(['text', 'emoji', 'file', 'system']);
export const ReactionTypeSchema = z.enum(['like', 'bookmark', 'empathy']);

// ===== 메시지 엔티티 스키마 =====
export const SenderSchema = z.object({
  nickname: z.string(),
  profileImageUrl: z.string(),
});

export const ReplyToSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  sender: z.object({ nickname: z.string() }),
  isDeleted: z.boolean(),
});

export const ReactionSchema = z.object({
  reactionType: ReactionTypeSchema,
  count: z.number().int().nonnegative(),
  reactedByMe: z.boolean(),
});

export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  fileUrl: z.string(),
  fileType: z.string(),
  fileSizeBytes: z.number().int().nonnegative(),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  chatRoomId: z.string().uuid(),
  senderId: z.string().uuid(),
  sender: SenderSchema,
  messageType: MessageTypeSchema,
  content: z.string(),
  replyToMessageId: z.string().uuid().nullable(),
  replyTo: ReplyToSchema.nullable(),
  isDeleted: z.boolean(),
  deletedAt: z.string().nullable(),
  reactions: z.array(ReactionSchema),
  attachments: z.array(AttachmentSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
export type Sender = z.infer<typeof SenderSchema>;
export type ReplyTo = z.infer<typeof ReplyToSchema>;
export type Reaction = z.infer<typeof ReactionSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;

// ===== 초기 메시지 로드 응답 =====
export const InitialMessagesResponseSchema = z.object({
  messages: z.array(MessageSchema),
  hasMore: z.boolean(),
  oldestMessageId: z.string().uuid().nullable(),
  newestMessageId: z.string().uuid().nullable(),
});

export type InitialMessagesResponse = z.infer<
  typeof InitialMessagesResponseSchema
>;

// ===== Polling 동기화 응답 =====
export const SyncMessagesResponseSchema = z.object({
  newMessages: z.array(MessageSchema),
  updatedMessages: z.array(MessageSchema),
  deletedMessageIds: z.array(z.string().uuid()),
});

export type SyncMessagesResponse = z.infer<typeof SyncMessagesResponseSchema>;

// ===== 메시지 전송 요청 =====
export const SendMessageRequestSchema = z.object({
  chatRoomId: z.string().uuid(),
  messageType: z.enum(['text', 'emoji', 'file']),
  content: z.string().min(1).max(10000),
  replyToMessageId: z.string().uuid().optional(),
  clientMessageId: z.string().uuid(),
  attachments: z
    .array(
      z.object({
        fileUrl: z.string(),
        fileType: z.string(),
        fileSizeBytes: z.number().int().nonnegative(),
      })
    )
    .optional(),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

// ===== 리액션 토글 요청 =====
export const ToggleReactionRequestSchema = z.object({
  messageId: z.string().uuid(),
  reactionType: ReactionTypeSchema,
});

export type ToggleReactionRequest = z.infer<
  typeof ToggleReactionRequestSchema
>;

// ===== 리액션 토글 응답 =====
export const ToggleReactionResponseSchema = z.object({
  message: MessageSchema,
  added: z.boolean(),
});

export type ToggleReactionResponse = z.infer<
  typeof ToggleReactionResponseSchema
>;

// ===== 메시지 삭제 응답 =====
export const DeleteMessageResponseSchema = z.object({
  message: MessageSchema,
  deletedAt: z.string(),
});

export type DeleteMessageResponse = z.infer<typeof DeleteMessageResponseSchema>;

// ===== 읽음 상태 업데이트 요청 =====
export const UpdateReadStatusRequestSchema = z.object({
  chatRoomId: z.string().uuid(),
  lastReadMessageId: z.string().uuid(),
});

export type UpdateReadStatusRequest = z.infer<
  typeof UpdateReadStatusRequestSchema
>;

// ===== 읽음 상태 업데이트 응답 =====
export const UpdateReadStatusResponseSchema = z.object({
  success: z.boolean(),
  lastReadMessageId: z.string().uuid(),
  lastReadAt: z.string(),
});

export type UpdateReadStatusResponse = z.infer<
  typeof UpdateReadStatusResponseSchema
>;

// ===== DB Row 스키마 (Supabase 조회 결과) =====
export const MessageRowSchema = z.object({
  id: z.string().uuid(),
  chat_room_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  message_type: z.string(),
  content: z.string().nullable(),
  reply_to_message_id: z.string().uuid().nullable(),
  is_deleted: z.boolean(),
  deleted_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MessageRow = z.infer<typeof MessageRowSchema>;

// ===== 채팅방 메타데이터 스키마 =====
export const RoomParticipantSchema = z.object({
  id: z.string().uuid(),
  nickname: z.string(),
  profileImageUrl: z.string(),
});

export const RoomMetaSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  roomType: z.enum(['direct', 'group']),
  participants: z.array(RoomParticipantSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RoomParticipant = z.infer<typeof RoomParticipantSchema>;
export type RoomMeta = z.infer<typeof RoomMetaSchema>;
