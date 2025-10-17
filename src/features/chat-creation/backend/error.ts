export const chatCreationErrorCodes = {
  invalidRequest: 'CHAT_CREATION/INVALID_REQUEST',
  unauthorized: 'CHAT_CREATION/UNAUTHORIZED',
  invalidUser: 'CHAT_CREATION/INVALID_USER',
  createError: 'CHAT_CREATION/CREATE_ERROR',
} as const;

export type ChatCreationErrorCode =
  (typeof chatCreationErrorCodes)[keyof typeof chatCreationErrorCodes];

export type ChatCreationServiceError = {
  code: ChatCreationErrorCode;
  message: string;
};
