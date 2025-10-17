'use client';

import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { ChatRoomItem } from '../lib/dto';

export type ChatListState = {
  rooms: Record<string, ChatRoomItem>;
  roomOrder: string[];
  filters: {
    search: string;
    showUnreadOnly: boolean;
    sortBy: 'recent' | 'alphabetical';
  };
  syncStatus: {
    loading: boolean;
    lastSuccessAt: string | null;
    lastError: string | null;
  };
};

export type ChatListAction =
  | { type: 'UPSERT_ROOMS'; payload: ChatRoomItem[] }
  | { type: 'SET_FILTER'; payload: Partial<ChatListState['filters']> }
  | {
      type: 'SET_SYNC_STATUS';
      payload: Partial<ChatListState['syncStatus']>;
    }
  | { type: 'CLEAR_ROOMS' };

const initialState: ChatListState = {
  rooms: {},
  roomOrder: [],
  filters: { search: '', showUnreadOnly: false, sortBy: 'recent' },
  syncStatus: { loading: false, lastSuccessAt: null, lastError: null },
};

const chatListReducer: React.Reducer<ChatListState, ChatListAction> = (
  state,
  action
) => {
  switch (action.type) {
    case 'UPSERT_ROOMS': {
      const nextRooms = { ...state.rooms };
      const nextOrder = new Set(state.roomOrder);

      action.payload.forEach((room) => {
        nextRooms[room.id] = room;
        nextOrder.add(room.id);
      });

      const sortedOrder = Array.from(nextOrder).sort((a, b) => {
        const roomA = nextRooms[a];
        const roomB = nextRooms[b];

        if (state.filters.sortBy === 'recent') {
          return (roomB.updatedAt || roomB.createdAt).localeCompare(
            roomA.updatedAt || roomA.createdAt
          );
        } else {
          return (roomA.name || '').localeCompare(roomB.name || '');
        }
      });

      return {
        ...state,
        rooms: nextRooms,
        roomOrder: sortedOrder,
      };
    }

    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: { ...state.syncStatus, ...action.payload },
      };

    case 'CLEAR_ROOMS':
      return initialState;

    default:
      return state;
  }
};

type ChatListContextValue = {
  state: ChatListState;
  dispatch: React.Dispatch<ChatListAction>;
  actions: {
    upsertRooms: (rooms: ChatRoomItem[]) => void;
    setFilter: (filter: Partial<ChatListState['filters']>) => void;
    setSyncStatus: (status: Partial<ChatListState['syncStatus']>) => void;
  };
};

const ChatListContext = createContext<ChatListContextValue | null>(null);

export const ChatListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(chatListReducer, initialState);

  const actions = useMemo(
    () => ({
      upsertRooms: (rooms: ChatRoomItem[]) =>
        dispatch({ type: 'UPSERT_ROOMS', payload: rooms }),
      setFilter: (filter: Partial<ChatListState['filters']>) =>
        dispatch({ type: 'SET_FILTER', payload: filter }),
      setSyncStatus: (status: Partial<ChatListState['syncStatus']>) =>
        dispatch({ type: 'SET_SYNC_STATUS', payload: status }),
    }),
    []
  );

  const value = useMemo<ChatListContextValue>(
    () => ({ state, dispatch, actions }),
    [state, actions]
  );

  return (
    <ChatListContext.Provider value={value}>
      {children}
    </ChatListContext.Provider>
  );
};

export const useChatListContext = () => {
  const value = useContext(ChatListContext);
  if (!value) {
    throw new Error('ChatListProvider가 트리 상단에 필요합니다.');
  }
  return value;
};
