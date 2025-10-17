'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  MessageSchema,
  type SendMessageRequest,
} from '@/features/chat-room/lib/dto';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';

export const useSendMessage = (userId: string) => {
  const { dispatch, actions } = useChatRoom();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SendMessageRequest) => {
      const { data } = await apiClient.post('/api/messages', request, {
        headers: {
          'x-user-id': userId,
        },
      });
      return MessageSchema.parse(data);
    },
    onMutate: async (request) => {
      const clientId = request.clientMessageId;

      // 낙관적 업데이트: pending 메시지 추가
      dispatch({
        type: 'MESSAGES/ADD_PENDING',
        payload: {
          clientId,
          status: 'sending',
          content: request.content,
          replyTo: request.replyToMessageId ?? null,
        },
      });

      // 컴포저 초기화
      dispatch({ type: 'COMPOSER/SET_DRAFT', payload: '' });
      dispatch({ type: 'COMPOSER/SET_REPLY_TO', payload: null });
    },
    onSuccess: (message, request) => {
      // Pending 메시지 제거 및 실제 메시지 추가
      dispatch({
        type: 'MESSAGES/ACK_PENDING',
        payload: {
          clientId: request.clientMessageId,
          serverId: message.id,
        },
      });

      actions.appendMessages([message]);

      // Sync 상태 업데이트
      dispatch({
        type: 'SYNC/UPDATE',
        payload: {
          lastMessageId: message.id,
          lastTimestamp: message.createdAt,
        },
      });
    },
    onError: (error, request) => {
      dispatch({
        type: 'MESSAGES/FAIL_PENDING',
        payload: {
          clientId: request.clientMessageId,
          error: extractApiErrorMessage(error, '메시지 전송에 실패했습니다.'),
        },
      });
    },
  });
};
