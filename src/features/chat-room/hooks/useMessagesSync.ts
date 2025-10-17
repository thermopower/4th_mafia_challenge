'use client';

import React from 'react';
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

  const query = useQuery({
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
  });

  React.useEffect(() => {
    if (query.data) {
      if (query.data.newMessages.length > 0) {
        actions.appendMessages(query.data.newMessages);
      }

      if (query.data.updatedMessages.length > 0) {
        actions.updateMessages(query.data.updatedMessages);
      }

      if (query.data.deletedMessageIds.length > 0) {
        dispatch({
          type: 'MESSAGES/REMOVE',
          payload: query.data.deletedMessageIds,
        });
      }
    }
  }, [query.data, actions, dispatch]);

  return query;
};
