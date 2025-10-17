'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useChatRoom } from '@/features/chat-room/contexts/chat-room-context';

export const ChatRoomHeader = () => {
  const router = useRouter();
  const { state } = useChatRoom();

  return (
    <header className="flex items-center gap-4 border-b bg-white px-4 py-3">
      <button
        onClick={() => router.back()}
        className="rounded-full p-2 hover:bg-gray-100"
        aria-label="뒤로 가기"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <h1 className="text-lg font-semibold">
          {state.roomMeta?.name ?? '채팅방'}
        </h1>
        <p className="text-sm text-gray-500">
          {state.roomMeta?.participants.length ?? 0}명
        </p>
      </div>
    </header>
  );
};
