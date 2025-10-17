'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MoreVertical, Heart, Bookmark, Smile } from 'lucide-react';
import type { Message } from '@/features/chat-room/lib/dto';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
  isHighlighted?: boolean;
};

export const MessageBubble = ({ message, isOwn, isHighlighted = false }: MessageBubbleProps) => {
  const { actions } = useChatRoom();

  const handleReactionClick = (
    reactionType: 'like' | 'bookmark' | 'empathy'
  ) => {
    actions.toggleReactionPicker(message.id);
  };

  const handleReplyClick = () => {
    actions.setReplyTo(message.id);
  };

  const handleDeleteClick = () => {
    actions.toggleDeleteModal(message.id);
  };

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] rounded-2xl bg-gray-100 px-4 py-2">
          <p className="text-sm text-gray-400">삭제된 메시지입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group transition-all ${
        isHighlighted ? 'animate-pulse bg-yellow-100 -mx-4 px-4 py-2 rounded-lg' : ''
      }`}
    >
      <div className="flex max-w-[70%] flex-col">
        {!isOwn && (
          <div className="mb-1 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.sender.profileImageUrl}
              alt={message.sender.nickname}
              className="h-6 w-6 rounded-full"
            />
            <span className="text-sm font-medium">
              {message.sender.nickname}
            </span>
          </div>
        )}

        {message.replyTo && (
          <button
            onClick={() => actions.highlightMessage(message.replyToMessageId)}
            className="mb-2 w-full rounded-lg bg-gray-50 p-2 text-left text-xs text-gray-600 hover:bg-gray-100 transition-colors"
            title="원본 메시지로 이동"
          >
            <p className="font-medium">{message.replyTo.sender.nickname}</p>
            <p className="truncate">
              {message.replyTo.isDeleted
                ? '삭제된 메시지'
                : message.replyTo.content}
            </p>
          </button>
        )}

        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((att) => (
                <div key={att.id} className="rounded bg-white/10 p-2 text-xs">
                  <a
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {att.fileType}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(message.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </span>

          {message.reactions.length > 0 && (
            <div className="flex gap-1">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.reactionType}
                  onClick={() => handleReactionClick(reaction.reactionType)}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    reaction.reactedByMe
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {reaction.reactionType === 'like' && <Heart className="h-3 w-3" />}
                  {reaction.reactionType === 'bookmark' && <Bookmark className="h-3 w-3" />}
                  {reaction.reactionType === 'empathy' && <Smile className="h-3 w-3" />}
                  {reaction.count}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleReplyClick}
              className="rounded-full px-2 py-1 text-xs hover:bg-gray-200"
              title="답장"
            >
              답장
            </button>
            <button
              onClick={() => actions.toggleReactionPicker(message.id)}
              className="rounded-full px-2 py-1 text-xs hover:bg-gray-200"
              title="리액션"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            {isOwn && (
              <button
                onClick={handleDeleteClick}
                className="rounded-full px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                title="삭제"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
