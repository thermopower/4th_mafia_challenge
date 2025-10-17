'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { ChatListResponseSchema } from '../lib/dto';
import { useChatListContext } from '../context/chat-list-context';

const POLL_INTERVAL = 5000;

const fetchChatRooms = async (since?: string) => {
  try {
    const url = since ? `/api/chat/rooms?since=${since}` : '/api/chat/rooms';
    const { data } = await apiClient.get(url);
    return ChatListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(
      error,
      'Failed to fetch chat rooms'
    );
    throw new Error(message);
  }
};

export const useChatListQuery = (enabled: boolean = true) => {
  const { state, actions } = useChatListContext();

  const query = useQuery({
    queryKey: ['chatRooms'],
    queryFn: () => fetchChatRooms(),
    enabled,
    refetchInterval: POLL_INTERVAL,
    staleTime: 0,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      actions.upsertRooms(query.data.rooms);
      actions.setSyncStatus({
        loading: false,
        lastSuccessAt: query.data.updatedAt,
        lastError: null,
      });
    }

    if (query.isError) {
      actions.setSyncStatus({
        loading: false,
        lastError: query.error.message,
      });
    }

    if (query.isLoading) {
      actions.setSyncStatus({ loading: true });
    }
  }, [
    query.isSuccess,
    query.isError,
    query.isLoading,
    query.data,
    query.error,
    actions,
  ]);

  return query;
};
