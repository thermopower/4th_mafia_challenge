import type { Message } from '@/features/chat-room/lib/dto';

export type MessageModel = Message;

export type PendingMessage = {
  clientId: string;
  status: 'sending' | 'failed';
  content: string;
  replyTo: string | null;
  errorMessage?: string;
};

export type ChatRoomState = {
  roomId: string | null;
  roomMeta: { name: string; participants: string[] } | null;

  // 메시지 타임라인
  messages: {
    byId: Record<string, MessageModel>;
    order: string[]; // 시간순 정렬된 메시지 ID
    pending: PendingMessage[];
  };

  // 무한 스크롤
  pagination: {
    cursor: string | null;
    isFetching: boolean;
    hasMore: boolean;
  };

  // Polling 동기화
  sync: {
    lastMessageId: string | null;
    lastTimestamp: string | null;
    isPolling: boolean;
  };

  // 컴포저
  composer: {
    draft: string;
    replyTo: string | null; // 메시지 ID
    validation: { isValid: boolean; message?: string };
  };

  // UI 상태
  ui: {
    reactionPicker: { isOpen: boolean; messageId: string | null };
    deleteModal: { isOpen: boolean; messageId: string | null };
    highlightedMessageId: string | null;
  };
};

export type ChatRoomAction =
  | { type: 'ENTER_ROOM'; payload: { roomId: string; meta: any } }
  | { type: 'EXIT_ROOM' }
  | { type: 'MESSAGES/SET_INITIAL'; payload: MessageModel[] }
  | { type: 'MESSAGES/APPEND'; payload: MessageModel[] }
  | { type: 'MESSAGES/PREPEND'; payload: MessageModel[] }
  | { type: 'MESSAGES/UPDATE'; payload: MessageModel[] }
  | { type: 'MESSAGES/REMOVE'; payload: string[] }
  | { type: 'MESSAGES/ADD_PENDING'; payload: PendingMessage }
  | {
      type: 'MESSAGES/ACK_PENDING';
      payload: { clientId: string; serverId: string };
    }
  | {
      type: 'MESSAGES/FAIL_PENDING';
      payload: { clientId: string; error: string };
    }
  | { type: 'PAGINATION/SET'; payload: Partial<ChatRoomState['pagination']> }
  | { type: 'SYNC/UPDATE'; payload: Partial<ChatRoomState['sync']> }
  | { type: 'COMPOSER/SET_DRAFT'; payload: string }
  | { type: 'COMPOSER/SET_REPLY_TO'; payload: string | null }
  | { type: 'UI/TOGGLE_REACTION_PICKER'; payload: { messageId: string | null } }
  | { type: 'UI/TOGGLE_DELETE_MODAL'; payload: { messageId: string | null } }
  | { type: 'UI/HIGHLIGHT_MESSAGE'; payload: string | null };

export const initialState: ChatRoomState = {
  roomId: null,
  roomMeta: null,
  messages: {
    byId: {},
    order: [],
    pending: [],
  },
  pagination: {
    cursor: null,
    isFetching: false,
    hasMore: true,
  },
  sync: {
    lastMessageId: null,
    lastTimestamp: null,
    isPolling: false,
  },
  composer: {
    draft: '',
    replyTo: null,
    validation: { isValid: true },
  },
  ui: {
    reactionPicker: { isOpen: false, messageId: null },
    deleteModal: { isOpen: false, messageId: null },
    highlightedMessageId: null,
  },
};
