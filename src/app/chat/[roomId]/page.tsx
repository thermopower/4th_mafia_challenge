'use client';

import React from 'react';
import { ChatRoomContainer } from '@/features/chat-room/components/chat-room-container';
import { useChatApp } from '@/contexts/chat-app-context';
import { useRouter } from 'next/navigation';

type PageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default function ChatRoomPage({ params }: PageProps) {
  const [roomId, setRoomId] = React.useState<string | null>(null);
  const { state } = useChatApp();
  const router = useRouter();

  React.useEffect(() => {
    params.then((p) => setRoomId(p.roomId));
  }, [params]);

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  React.useEffect(() => {
    if (!state.auth.profile) {
      router.push('/login');
    }
  }, [state.auth.profile, router]);

  if (!roomId || !state.auth.profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <p className="text-slate-300">로딩 중...</p>
      </div>
    );
  }

  return <ChatRoomContainer roomId={roomId} userId={state.auth.profile.id} />;
}
