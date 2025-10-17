import type React from 'react';
import type { ChatRoomState, ChatRoomAction, MessageModel } from './types';
import { initialState } from './types';

export const chatRoomReducer: React.Reducer<ChatRoomState, ChatRoomAction> = (
  state,
  action
) => {
  switch (action.type) {
    case 'ENTER_ROOM':
      return {
        ...initialState,
        roomId: action.payload.roomId,
        roomMeta: action.payload.meta,
      };

    case 'SET_ROOM_META':
      return {
        ...state,
        roomMeta: action.payload,
      };

    case 'EXIT_ROOM':
      return initialState;

    case 'SET_LAST_READ_MESSAGE_ID':
      return {
        ...state,
        lastReadMessageId: action.payload,
      };

    case 'MESSAGES/SET_INITIAL': {
      const byId: Record<string, MessageModel> = {};
      const order: string[] = [];

      action.payload.forEach((msg) => {
        byId[msg.id] = msg;
        order.push(msg.id);
      });

      // 시간순 정렬
      order.sort(
        (a, b) =>
          new Date(byId[a].createdAt).getTime() -
          new Date(byId[b].createdAt).getTime()
      );

      return {
        ...state,
        messages: { ...state.messages, byId, order },
        sync: {
          ...state.sync,
          lastMessageId: order[order.length - 1] ?? null,
          lastTimestamp:
            order.length > 0
              ? byId[order[order.length - 1]].createdAt
              : null,
        },
      };
    }

    case 'MESSAGES/APPEND': {
      const newById = { ...state.messages.byId };
      const newOrder = [...state.messages.order];

      action.payload.forEach((msg) => {
        if (!newById[msg.id]) {
          newById[msg.id] = msg;
          newOrder.push(msg.id);
        }
      });

      // 시간순 정렬
      newOrder.sort(
        (a, b) =>
          new Date(newById[a].createdAt).getTime() -
          new Date(newById[b].createdAt).getTime()
      );

      // sync 상태 업데이트
      const lastId = newOrder[newOrder.length - 1] ?? null;
      const lastTimestamp = lastId ? newById[lastId].createdAt : null;

      return {
        ...state,
        messages: { ...state.messages, byId: newById, order: newOrder },
        sync: {
          ...state.sync,
          lastMessageId: lastId,
          lastTimestamp,
        },
      };
    }

    case 'MESSAGES/PREPEND': {
      const newById = { ...state.messages.byId };
      const newOrder = [...state.messages.order];

      action.payload.forEach((msg) => {
        if (!newById[msg.id]) {
          newById[msg.id] = msg;
          newOrder.unshift(msg.id);
        }
      });

      // 시간순 정렬
      newOrder.sort(
        (a, b) =>
          new Date(newById[a].createdAt).getTime() -
          new Date(newById[b].createdAt).getTime()
      );

      return {
        ...state,
        messages: { ...state.messages, byId: newById, order: newOrder },
      };
    }

    case 'MESSAGES/UPDATE': {
      const updatedById = { ...state.messages.byId };

      action.payload.forEach((msg) => {
        if (updatedById[msg.id]) {
          updatedById[msg.id] = msg;
        }
      });

      return {
        ...state,
        messages: { ...state.messages, byId: updatedById },
      };
    }

    case 'MESSAGES/REMOVE': {
      const filteredById = { ...state.messages.byId };
      const filteredOrder = state.messages.order.filter(
        (id) => !action.payload.includes(id)
      );

      action.payload.forEach((id) => delete filteredById[id]);

      return {
        ...state,
        messages: {
          ...state.messages,
          byId: filteredById,
          order: filteredOrder,
        },
      };
    }

    case 'MESSAGES/ADD_PENDING':
      return {
        ...state,
        messages: {
          ...state.messages,
          pending: [...state.messages.pending, action.payload],
        },
      };

    case 'MESSAGES/ACK_PENDING': {
      const pendingFiltered = state.messages.pending.filter(
        (p) => p.clientId !== action.payload.clientId
      );

      return {
        ...state,
        messages: { ...state.messages, pending: pendingFiltered },
      };
    }

    case 'MESSAGES/FAIL_PENDING': {
      const pendingUpdated = state.messages.pending.map((p) =>
        p.clientId === action.payload.clientId
          ? { ...p, status: 'failed' as const, errorMessage: action.payload.error }
          : p
      );

      return {
        ...state,
        messages: { ...state.messages, pending: pendingUpdated },
      };
    }

    case 'PAGINATION/SET':
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case 'SYNC/UPDATE':
      return {
        ...state,
        sync: { ...state.sync, ...action.payload },
      };

    case 'COMPOSER/SET_DRAFT':
      return {
        ...state,
        composer: { ...state.composer, draft: action.payload },
      };

    case 'COMPOSER/SET_REPLY_TO':
      return {
        ...state,
        composer: { ...state.composer, replyTo: action.payload },
      };

    case 'UI/TOGGLE_REACTION_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          reactionPicker: {
            isOpen: action.payload.messageId !== null,
            messageId: action.payload.messageId,
          },
        },
      };

    case 'UI/TOGGLE_DELETE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          deleteModal: {
            isOpen: action.payload.messageId !== null,
            messageId: action.payload.messageId,
          },
        },
      };

    case 'UI/HIGHLIGHT_MESSAGE':
      return {
        ...state,
        ui: { ...state.ui, highlightedMessageId: action.payload },
      };

    default:
      return state;
  }
};
