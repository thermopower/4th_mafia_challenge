'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/remote/api-client';
import {
  ToggleReactionResponseSchema,
  type ToggleReactionRequest,
} from '@/features/chat-room/lib/dto';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';

export const useToggleReaction = (userId: string) => {
  const { actions } = useChatRoom();

  return useMutation({
    mutationFn: async (request: ToggleReactionRequest) => {
      const { data } = await apiClient.post(
        `/api/messages/${request.messageId}/reactions`,
        {
          reactionType: request.reactionType,
        },
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );
      return ToggleReactionResponseSchema.parse(data);
    },
    onSuccess: (data) => {
      // 메시지 리액션 정보 업데이트
      actions.updateMessages([data.message]);
    },
    onError: (error) => {
      toast.error('리액션 처리 중 오류가 발생했습니다.', {
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    },
  });
};
