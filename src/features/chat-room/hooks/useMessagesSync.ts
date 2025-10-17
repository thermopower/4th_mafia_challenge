'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { SyncMessagesResponseSchema } from '@/features/chat-room/lib/dto';
import { CHAT_ROOM_CONSTANTS } from '@/features/chat-room/constants';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';

export const useMessagesSync = (
  roomId: string,
  userId: string,
  enabled: boolean
) => {
  const { state, actions, dispatch } = useChatRoom();

  return useQuery({
    queryKey: [
      'chat-room-sync',
      roomId,
      state.sync.lastMessageId,
      state.sync.lastTimestamp,
    ],
    queryFn: async () => {
      if (!state.sync.lastMessageId || !state.sync.lastTimestamp) {
        return null;
      }

      const { data } = await apiClient.get(
        `/api/chat-rooms/${roomId}/messages/sync`,
        {
          params: {
            afterTimestamp: state.sync.lastTimestamp,
          },
          headers: {
            'x-user-id': userId,
          },
        }
      );
      return SyncMessagesResponseSchema.parse(data);
    },
    enabled:
      enabled && Boolean(state.sync.lastMessageId && state.sync.lastTimestamp),
    refetchInterval: CHAT_ROOM_CONSTANTS.POLLING_INTERVAL,
    onSuccess: (data) => {
      if (!data) return;

      if (data.newMessages.length > 0) {
        actions.appendMessages(data.newMessages);
      }

      if (data.updatedMessages.length > 0) {
        actions.updateMessages(data.updatedMessages);
      }

      if (data.deletedMessageIds.length > 0) {
        dispatch({
          type: 'MESSAGES/REMOVE',
          payload: data.deletedMessageIds,
        });
      }
    },
  });
};
