'use client';

import React from 'react';
import { Send, X } from 'lucide-react';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';
import { useSendMessage } from '@/features/chat-room/hooks/useSendMessage';
import { v4 as uuidv4 } from 'uuid';

type MessageComposerProps = {
  userId: string;
};

export const MessageComposer = ({ userId }: MessageComposerProps) => {
  const { state, dispatch, actions } = useChatRoom();
  const sendMessageMutation = useSendMessage(userId);

  const handleSend = () => {
    const content = state.composer.draft.trim();
    if (!content || !state.roomId) return;

    sendMessageMutation.mutate({
      chatRoomId: state.roomId,
      messageType: 'text',
      content,
      clientMessageId: uuidv4(),
      replyToMessageId: state.composer.replyTo ?? undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const replyToMessage = state.composer.replyTo
    ? state.messages.byId[state.composer.replyTo]
    : null;

  return (
    <div className="border-t bg-white p-4">
      {replyToMessage && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-50 p-2">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600">
              {replyToMessage.sender.nickname}에게 답장
            </p>
            <p className="truncate text-sm text-gray-500">
              {replyToMessage.content}
            </p>
          </div>
          <button
            onClick={() => actions.setReplyTo(null)}
            className="rounded-full p-1 hover:bg-gray-200"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={state.composer.draft}
          onChange={(e) =>
            dispatch({ type: 'COMPOSER/SET_DRAFT', payload: e.target.value })
          }
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!state.composer.draft.trim()}
          className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
