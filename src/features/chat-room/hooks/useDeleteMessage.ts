'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
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

      // 성공 토스트
      toast.success('메시지가 삭제되었습니다.');
    },
    onError: (error) => {
      toast.error('메시지 삭제 중 오류가 발생했습니다.', {
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    },
  });
};
