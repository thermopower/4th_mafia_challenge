'use client';

import React from 'react';
import type { ChatRoomState, ChatRoomAction, MessageModel } from './types';

export type ChatRoomContextValue = {
  state: ChatRoomState;
  dispatch: React.Dispatch<ChatRoomAction>;
  actions: {
    setInitialMessages: (messages: MessageModel[]) => void;
    appendMessages: (messages: MessageModel[]) => void;
    updateMessages: (messages: MessageModel[]) => void;
    setReplyTo: (messageId: string | null) => void;
    toggleReactionPicker: (messageId: string | null) => void;
    toggleDeleteModal: (messageId: string | null) => void;
    highlightMessage: (messageId: string | null) => void;
  };
};

export const ChatRoomContext = React.createContext<
  ChatRoomContextValue | undefined
>(undefined);

export const useChatRoom = () => {
  const context = React.useContext(ChatRoomContext);
  if (!context) {
    throw new Error('useChatRoom must be used within ChatRoomProvider');
  }
  return context;
};
