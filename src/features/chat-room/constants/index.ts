export const CHAT_ROOM_CONSTANTS = {
  POLLING_INTERVAL: 3000, // 3초
  MESSAGE_LIMIT: 30,
  READ_STATUS_DEBOUNCE: 1000, // 1초
  MAX_MESSAGE_LENGTH: 10000,
  SCROLL_THRESHOLD: 100, // 하단 스크롤 판정 임계값
} as const;

export const REACTION_TYPES = ['like', 'bookmark', 'empathy'] as const;

export const MESSAGE_TYPES = ['text', 'emoji', 'file', 'system'] as const;
