'use client';

import React from 'react';
import { ChatRoomContext } from './chat-room-context';
import { chatRoomReducer } from './reducer';
import { initialState } from './types';
import type { MessageModel } from './types';

export const ChatRoomProvider = ({
  children,
  roomId,
}: {
  children: React.ReactNode;
  roomId: string;
}) => {
  const [state, dispatch] = React.useReducer(chatRoomReducer, initialState);

  // 방 진입 시 초기화
  React.useEffect(() => {
    dispatch({ type: 'ENTER_ROOM', payload: { roomId, meta: null } });

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
