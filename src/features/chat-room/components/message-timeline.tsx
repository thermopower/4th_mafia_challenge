'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';
import { useMessagesQuery } from '@/features/chat-room/hooks/useMessagesQuery';
import { useMessagesSync } from '@/features/chat-room/hooks/useMessagesSync';
import { useUpdateReadStatus } from '@/features/chat-room/hooks/useUpdateReadStatus';
import { MessageBubble } from './message-bubble';
import { UnreadDivider } from './unread-divider';
import { isScrolledToBottom, scrollToBottom } from '@/features/chat-room/lib/scroll-utils';

type MessageTimelineProps = {
  roomId: string;
  userId: string;
};

export const MessageTimeline = ({ roomId, userId }: MessageTimelineProps) => {
  const { state, actions } = useChatRoom();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMessagesQuery(roomId, userId);

  // Polling 동기화
  useMessagesSync(roomId, userId, true);

  // 읽음 상태 업데이트
  const { updateReadStatus } = useUpdateReadStatus(roomId, userId);

  // 최초 로드 후 하단 스크롤
  React.useEffect(() => {
    if (!isLoading && state.messages.order.length > 0) {
      scrollToBottom(containerRef, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // 신규 메시지 도착 시 하단 스크롤
  React.useEffect(() => {
    if (containerRef.current && isScrolledToBottom(containerRef)) {
      scrollToBottom(containerRef, true);
    }
  }, [state.messages.order.length]);

  // 하이라이트된 메시지로 스크롤
  React.useEffect(() => {
    if (state.ui.highlightedMessageId && containerRef.current) {
      const messageElement = document.getElementById(
        `message-${state.ui.highlightedMessageId}`
      );
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 3초 후 하이라이트 제거
        const timer = setTimeout(() => {
          actions.highlightMessage(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [state.ui.highlightedMessageId, actions]);

  // 스크롤 이벤트: 상단 도달 시 무한 스크롤
  const handleScroll = React.useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop } = containerRef.current;

    if (scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }

    // 읽음 상태 업데이트 (마지막 메시지)
    if (state.messages.order.length > 0) {
      const lastMessageId =
        state.messages.order[state.messages.order.length - 1];
      updateReadStatus(lastMessageId);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, state.messages.order, updateReadStatus]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (state.messages.order.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">메시지가 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}

      <div className="space-y-4">
        {state.messages.order.map((messageId, index) => {
          const message = state.messages.byId[messageId];
          if (!message) return null;

          // 읽지 않은 메시지 구분선 표시
          const showUnreadDivider =
            state.lastReadMessageId &&
            index > 0 &&
            state.messages.order[index - 1] === state.lastReadMessageId;

          return (
            <React.Fragment key={messageId}>
              {showUnreadDivider && <UnreadDivider />}
              <MessageBubble
                message={message}
                isOwn={message.senderId === userId}
                isHighlighted={state.ui.highlightedMessageId === messageId}
                userId={userId}
              />
            </React.Fragment>
          );
        })}

        {state.messages.pending.map((pending) => (
          <div
            key={pending.clientId}
            className="flex justify-end"
          >
            <div className="max-w-[70%] rounded-2xl bg-blue-500 px-4 py-2 text-white opacity-60">
              <p>{pending.content}</p>
              <p className="mt-1 text-xs">
                {pending.status === 'sending' ? '전송 중...' : '전송 실패'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
