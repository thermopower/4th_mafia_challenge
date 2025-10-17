import { z } from 'zod';

export const CreateChatRequestSchema = z
  .object({
    type: z.enum(['direct', 'group']),
    name: z.string().min(1).max(50).nullable(),
    user_ids: z.array(z.string().uuid()).min(1).max(50),
  })
  .refine(
    (data) =>
      data.type !== 'group' || (data.name && data.name.trim().length > 0),
    { message: '그룹 채팅은 이름이 필수입니다', path: ['name'] }
  );

export const CreateChatResponseSchema = z.object({
  chat_room_id: z.string().uuid(),
  room_type: z.enum(['direct', 'group']),
  name: z.string().nullable(),
  members: z.array(
    z.object({
      user_id: z.string().uuid(),
      nickname: z.string(),
      profile_image_url: z.string(),
    })
  ),
  created_at: z.string(),
  exists: z.boolean().optional(),
});

export type CreateChatRequest = z.infer<typeof CreateChatRequestSchema>;
export type CreateChatResponse = z.infer<typeof CreateChatResponseSchema>;
