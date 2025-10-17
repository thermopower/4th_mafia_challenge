import { z } from 'zod';

export const UserSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query must not be empty'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const UserSearchItemSchema = z.object({
  id: z.string().uuid(),
  nickname: z.string(),
  profileImageUrl: z.string(),
  accountStatus: z.string(),
});

export const UserSearchResponseSchema = z.object({
  users: z.array(UserSearchItemSchema),
});

export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;
export type UserSearchItem = z.infer<typeof UserSearchItemSchema>;
export type UserSearchResponse = z.infer<typeof UserSearchResponseSchema>;
