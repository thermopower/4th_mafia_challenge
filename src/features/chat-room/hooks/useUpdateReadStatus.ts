'use client';

import { useMutation } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { apiClient } from '@/lib/remote/api-client';
import { UpdateReadStatusResponseSchema } from '@/features/chat-room/lib/dto';
import { CHAT_ROOM_CONSTANTS } from '@/features/chat-room/constants';

export const useUpdateReadStatus = (roomId: string, userId: string) => {
  const mutation = useMutation({
    mutationFn: async (lastReadMessageId: string) => {
      const { data } = await apiClient.post(
        `/api/chat-rooms/${roomId}/read`,
        {
          lastReadMessageId,
        },
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );
      return UpdateReadStatusResponseSchema.parse(data);
    },
  });

  const debouncedUpdate = useDebouncedCallback(
    (lastReadMessageId: string) => {
      mutation.mutate(lastReadMessageId);
    },
    CHAT_ROOM_CONSTANTS.READ_STATUS_DEBOUNCE
  );

  return {
    updateReadStatus: debouncedUpdate,
    ...mutation,
  };
};
