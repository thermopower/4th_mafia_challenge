'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  UserSearchResponseSchema,
  type UserSearchItem,
} from '@/features/user-search/lib/dto';

const searchUsers = async (query: string): Promise<UserSearchItem[]> => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const { data } = await apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}`);
    const validated = UserSearchResponseSchema.parse(data);
    return validated.users;
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to search users');
    throw new Error(message);
  }
};

export const useUserSearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: () => searchUsers(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 30000,
  });
};
