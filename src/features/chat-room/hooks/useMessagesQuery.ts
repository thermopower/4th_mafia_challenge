'use client';

import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { InitialMessagesResponseSchema } from '@/features/chat-room/lib/dto';
import { CHAT_ROOM_CONSTANTS } from '@/features/chat-room/constants';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';

export const useMessagesQuery = (roomId: string, userId: string) => {
  const { actions, dispatch } = useChatRoom();

  const query = useInfiniteQuery({
    queryKey: ['chat-room-messages', roomId],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get(
        `/api/chat-rooms/${roomId}/messages`,
        {
          params: {
            beforeTimestamp: pageParam,
            limit: CHAT_ROOM_CONSTANTS.MESSAGE_LIMIT,
          },
          headers: {
            'x-user-id': userId,
          },
        }
      );
      return InitialMessagesResponseSchema.parse(data);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.oldestMessageId : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!roomId && !!userId,
    staleTime: 0,
  });

  React.useEffect(() => {
    if (query.data) {
      const allMessages = query.data.pages.flatMap((page) => page.messages);
      actions.setInitialMessages(allMessages);

      // 마지막 메시지 정보 업데이트
      const lastPage = query.data.pages[query.data.pages.length - 1];
      if (lastPage?.newestMessageId) {
        dispatch({
          type: 'SYNC/UPDATE',
          payload: {
            lastMessageId: lastPage.newestMessageId,
            lastTimestamp:
              allMessages.find((m) => m.id === lastPage.newestMessageId)
                ?.createdAt ?? null,
          },
        });
      }

      // hasMore 업데이트
      dispatch({
        type: 'PAGINATION/SET',
        payload: {
          hasMore: lastPage?.hasMore ?? false,
        },
      });

      // 초기 로드 시 중간 메시지를 lastReadMessageId로 설정 (데모)
      if (allMessages.length > 5) {
        const middleIndex = Math.floor(allMessages.length * 0.6);
        dispatch({
          type: 'SET_LAST_READ_MESSAGE_ID',
          payload: allMessages[middleIndex].id,
        });
      }
    }
  }, [query.data, actions, dispatch]);

  return query;
};
