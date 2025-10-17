'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';
import { useDeleteMessage } from '@/features/chat-room/hooks/useDeleteMessage';

type DeleteMessageModalProps = {
  userId: string;
};

export const DeleteMessageModal = ({ userId }: DeleteMessageModalProps) => {
  const { state, actions } = useChatRoom();
  const deleteMessage = useDeleteMessage(userId);

  const { isOpen, messageId } = state.ui.deleteModal;

  const handleClose = () => {
    actions.toggleDeleteModal(null);
  };

  const handleConfirm = () => {
    if (messageId) {
      deleteMessage.mutate(messageId);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>메시지 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            이 메시지를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMessage.isPending}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMessage.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMessage.isPending ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
