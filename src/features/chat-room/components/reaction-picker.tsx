'use client';

import React from 'react';
import { Heart, Bookmark, Smile } from 'lucide-react';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';
import { useToggleReaction } from '@/features/chat-room/hooks/useToggleReaction';

type ReactionPickerProps = {
  userId: string;
};

export const ReactionPicker = ({ userId }: ReactionPickerProps) => {
  const { state, actions } = useChatRoom();
  const toggleReactionMutation = useToggleReaction(userId);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  const messageId = state.ui.reactionPicker.messageId;
  const message = messageId ? state.messages.byId[messageId] : null;

  const handleReactionClick = (
    reactionType: 'like' | 'bookmark' | 'empathy'
  ) => {
    if (!messageId) return;

    toggleReactionMutation.mutate({
      messageId,
      reactionType,
    });

    // 리액션 선택 후 피커 닫기
    actions.toggleReactionPicker(null);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        actions.toggleReactionPicker(null);
      }
    };

    if (state.ui.reactionPicker.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.ui.reactionPicker.isOpen, actions]);

  if (!state.ui.reactionPicker.isOpen || !message) {
    return null;
  }

  // 메시지 요소의 위치를 찾아서 피커를 적절한 위치에 표시
  const messageElement = document.getElementById(`message-${messageId}`);
  if (!messageElement) return null;

  const rect = messageElement.getBoundingClientRect();

  return (
    <div
      ref={pickerRef}
      className="fixed z-50"
      style={{
        top: `${rect.top - 60}px`,
        left: `${rect.left + rect.width / 2 - 80}px`,
      }}
    >
      <div className="flex gap-2 rounded-full bg-white p-2 shadow-lg border border-gray-200">
        <button
          onClick={() => handleReactionClick('like')}
          className="flex items-center justify-center rounded-full p-2 hover:bg-red-50 transition-colors group"
          title="좋아요"
          disabled={toggleReactionMutation.isPending}
        >
          <Heart className="h-6 w-6 text-gray-600 group-hover:text-red-500 group-hover:fill-red-500 transition-colors" />
        </button>
        <button
          onClick={() => handleReactionClick('bookmark')}
          className="flex items-center justify-center rounded-full p-2 hover:bg-blue-50 transition-colors group"
          title="북마크"
          disabled={toggleReactionMutation.isPending}
        >
          <Bookmark className="h-6 w-6 text-gray-600 group-hover:text-blue-500 group-hover:fill-blue-500 transition-colors" />
        </button>
        <button
          onClick={() => handleReactionClick('empathy')}
          className="flex items-center justify-center rounded-full p-2 hover:bg-yellow-50 transition-colors group"
          title="공감"
          disabled={toggleReactionMutation.isPending}
        >
          <Smile className="h-6 w-6 text-gray-600 group-hover:text-yellow-500 group-hover:fill-yellow-500 transition-colors" />
        </button>
      </div>
    </div>
  );
};
