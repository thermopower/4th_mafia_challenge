'use client';

import React from 'react';
import { ChatRoomContext } from './chat-room-context';
import { chatRoomReducer } from './reducer';
import { initialState } from './types';
import type { MessageModel } from './types';
import { apiClient } from '@/lib/remote/api-client';
import type { RoomMeta } from '@/features/chat-room/lib/dto';

export const ChatRoomProvider = ({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId: string;
}) => {
  const [state, dispatch] = React.useReducer(chatRoomReducer, initialState);

  // 방 진입 시 초기화 및 메타데이터 fetch
  React.useEffect(() => {
    dispatch({ type: 'ENTER_ROOM', payload: { roomId, meta: null } });

    // 채팅방 메타데이터 조회
    const fetchRoomMeta = async () => {
      try {
        const response = await apiClient.GET(`/api/chat-rooms/${roomId}`);
        if (response.ok && response.data) {
          dispatch({ type: 'SET_ROOM_META', payload: response.data as RoomMeta });
        }
      } catch (error) {
        console.error('Failed to fetch room meta:', error);
      }
    };

    fetchRoomMeta();

    return () => {
      dispatch({ type: 'EXIT_ROOM' });
    };
  }, [roomId]);

  const actions = React.useMemo(
    () => ({
      setInitialMessages: (messages: MessageModel[]) =>
        dispatch({ type: 'MESSAGES/SET_INITIAL', payload: messages }),

      appendMessages: (messages: MessageModel[]) =>
        dispatch({ type: 'MESSAGES/APPEND', payload: messages }),

      updateMessages: (messages: MessageModel[]) =>
        dispatch({ type: 'MESSAGES/UPDATE', payload: messages }),

      setReplyTo: (messageId: string | null) =>
        dispatch({ type: 'COMPOSER/SET_REPLY_TO', payload: messageId }),

      toggleReactionPicker: (messageId: string | null) =>
        dispatch({
          type: 'UI/TOGGLE_REACTION_PICKER',
          payload: { messageId },
        }),

      toggleDeleteModal: (messageId: string | null) =>
        dispatch({ type: 'UI/TOGGLE_DELETE_MODAL', payload: { messageId } }),

      highlightMessage: (messageId: string | null) =>
        dispatch({ type: 'UI/HIGHLIGHT_MESSAGE', payload: messageId }),
    }),
    []
  );

  const value = React.useMemo(
    () => ({ state, dispatch, actions }),
    [state, actions]
  );

  return (
    <ChatRoomContext.Provider value={value}>
      {children}
    </ChatRoomContext.Provider>
  );
};
