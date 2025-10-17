'use client';

import { useMemo } from 'react';
import { useChatListContext } from '../context/chat-list-context';
import { useChatListQuery } from '../hooks/use-chat-list-query';
import { ChatRoomItem } from './chat-room-item';
import { ChatListEmptyState } from './chat-list-empty-state';
import { ChatListSkeleton } from './chat-list-skeleton';

type Props = {
  currentUserId?: string;
};

export const ChatListPanel = ({ currentUserId }: Props) => {
  const { state } = useChatListContext();
  const { isLoading, isError, error } = useChatListQuery();

  const filteredRooms = useMemo(() => {
    let rooms = state.roomOrder.map((id) => state.rooms[id]);

    if (state.filters.search) {
      rooms = rooms.filter((room) =>
        room.name?.toLowerCase().includes(state.filters.search.toLowerCase())
      );
    }

    if (state.filters.showUnreadOnly) {
      rooms = rooms.filter((room) => room.unreadCount > 0);
    }

    return rooms;
  }, [state.roomOrder, state.rooms, state.filters]);

  if (isLoading) return <ChatListSkeleton />;

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-rose-400">오류 발생: {error?.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          재시도
        </button>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return <ChatListEmptyState />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {filteredRooms.map((room) => (
        <ChatRoomItem key={room.id} room={room} currentUserId={currentUserId} />
      ))}
    </div>
  );
};
