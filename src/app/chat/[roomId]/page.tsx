'use client';

import React from 'react';
import { ChatRoomContainer } from '@/features/chat-room/components/chat-room-container';

type PageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default function ChatRoomPage({ params }: PageProps) {
  const [roomId, setRoomId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then((p) => setRoomId(p.roomId));
  }, [params]);

  // TODO: 실제 인증된 userId를 가져오도록 수정
  const userId = 'temp-user-id';

  if (!roomId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return <ChatRoomContainer roomId={roomId} userId={userId} />;
}
