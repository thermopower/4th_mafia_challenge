'use client';

import React from 'react';
import { Send, X, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';
import { useSendMessage } from '@/features/chat-room/hooks/useSendMessage';
import { v4 as uuidv4 } from 'uuid';

type MessageComposerProps = {
  userId: string;
};

export const MessageComposer = ({ userId }: MessageComposerProps) => {
  const { state, dispatch, actions } = useChatRoom();
  const sendMessageMutation = useSendMessage(userId);

  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = React.useRef<HTMLDivElement>(null);

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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const currentDraft = state.composer.draft;
    const newDraft =
      currentDraft.slice(0, cursorPosition) +
      emojiData.emoji +
      currentDraft.slice(cursorPosition);

    dispatch({ type: 'COMPOSER/SET_DRAFT', payload: newDraft });

    setTimeout(() => {
      if (textarea) {
        const newCursorPosition = cursorPosition + emojiData.emoji.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        textarea.focus();
      }
    }, 0);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const replyToMessage = state.composer.replyTo
    ? state.messages.byId[state.composer.replyTo]
    : null;

  return (
    <div className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-4">
      {replyToMessage && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-800/50 p-2">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-300">
              {replyToMessage.sender.nickname}에게 답장
            </p>
            <p className="truncate text-sm text-slate-400">
              {replyToMessage.content}
            </p>
          </div>
          <button
            onClick={() => actions.setReplyTo(null)}
            className="rounded-full p-1 hover:bg-slate-700"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      )}

      <div className="relative flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={state.composer.draft}
            onChange={(e) =>
              dispatch({ type: 'COMPOSER/SET_DRAFT', payload: e.target.value })
            }
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="w-full resize-none rounded-2xl border border-slate-600 bg-slate-800/50 text-slate-100 placeholder:text-slate-400 px-4 py-2 pr-12 focus:border-slate-400 focus:outline-none"
            rows={1}
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-slate-700"
          >
            <Smile className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!state.composer.draft.trim()}
          className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>

        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full right-0 mb-2 z-10"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={320}
              height={400}
            />
          </div>
        )}
      </div>
    </div>
  );
};
