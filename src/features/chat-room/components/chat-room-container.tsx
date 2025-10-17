'use client';

import React from 'react';
import { ChatRoomProvider } from '@/features/chat-room/contexts/chat-room-provider';
import { ChatRoomHeader } from './chat-room-header';
import { MessageTimeline } from './message-timeline';
import { MessageComposer } from './message-composer';
import { DeleteMessageModal } from './delete-message-modal';
import { ReactionPicker } from './reaction-picker';

type ChatRoomContainerProps = {
  roomId: string;
  userId: string;
};

export const ChatRoomContainer = ({
  roomId,
  userId,
}: ChatRoomContainerProps) => {
  return (
    <ChatRoomProvider roomId={roomId}>
      <div className="flex h-screen flex-col">
        <ChatRoomHeader />
        <MessageTimeline roomId={roomId} userId={userId} />
        <MessageComposer userId={userId} />
        <DeleteMessageModal userId={userId} />
        <ReactionPicker userId={userId} />
      </div>
    </ChatRoomProvider>
  );
};
