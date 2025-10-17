'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { DeleteMessageResponseSchema } from '@/features/chat-room/lib/dto';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';

export const useDeleteMessage = (userId: string) => {
  const { actions } = useChatRoom();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data } = await apiClient.delete(`/api/messages/${messageId}`, {
        headers: {
          'x-user-id': userId,
        },
      });
      return DeleteMessageResponseSchema.parse(data);
    },
    onSuccess: (data) => {
      // 메시지 삭제 상태 업데이트
      actions.updateMessages([data.message]);

      // 모달 닫기
      actions.toggleDeleteModal(null);
    },
  });
};
