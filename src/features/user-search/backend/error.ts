export const userSearchErrorCodes = {
  invalidQuery: 'USER_SEARCH/INVALID_QUERY',
  unauthorized: 'USER_SEARCH/UNAUTHORIZED',
  searchError: 'USER_SEARCH/SEARCH_ERROR',
} as const;

export type UserSearchErrorCode =
  (typeof userSearchErrorCodes)[keyof typeof userSearchErrorCodes];

export type UserSearchServiceError = {
  code: UserSearchErrorCode;
  message: string;
};
