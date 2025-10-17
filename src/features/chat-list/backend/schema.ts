import { z } from 'zod';

export const ChatListQuerySchema = z.object({
  since: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const ParticipantSchema = z.object({
  id: z.string().uuid(),
  nickname: z.string(),
  profileImageUrl: z.string(),
});

export const LastMessageSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  type: z.enum(['text', 'emoji', 'file', 'system']),
  senderId: z.string().uuid(),
  senderNickname: z.string(),
  isDeleted: z.boolean(),
  createdAt: z.string(),
});

export const ChatRoomItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['direct', 'group']),
  name: z.string().nullable(),
  participants: z.array(ParticipantSchema),
  lastMessage: LastMessageSchema.nullable(),
  unreadCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ChatListResponseSchema = z.object({
  rooms: z.array(ChatRoomItemSchema),
  hasMore: z.boolean(),
  updatedAt: z.string(),
});

export type ChatListQuery = z.infer<typeof ChatListQuerySchema>;
export type Participant = z.infer<typeof ParticipantSchema>;
export type LastMessage = z.infer<typeof LastMessageSchema>;
export type ChatRoomItem = z.infer<typeof ChatRoomItemSchema>;
export type ChatListResponse = z.infer<typeof ChatListResponseSchema>;
