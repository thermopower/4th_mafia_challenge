export const chatListErrorCodes = {
  invalidQuery: 'CHAT_LIST/INVALID_QUERY',
  unauthorized: 'CHAT_LIST/UNAUTHORIZED',
  fetchError: 'CHAT_LIST/FETCH_ERROR',
} as const;

export type ChatListErrorCode =
  (typeof chatListErrorCodes)[keyof typeof chatListErrorCodes];

export type ChatListServiceError = {
  code: ChatListErrorCode;
  message: string;
};
