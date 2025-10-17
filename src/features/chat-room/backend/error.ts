export const chatRoomErrorCodes = {
  // 권한 관련
  notMember: 'CHAT_ROOM_NOT_MEMBER',
  notAuthorized: 'CHAT_ROOM_NOT_AUTHORIZED',

  // 리소스 관련
  roomNotFound: 'CHAT_ROOM_NOT_FOUND',
  messageNotFound: 'MESSAGE_NOT_FOUND',

  // 중복 방지
  duplicateMessage: 'DUPLICATE_MESSAGE',

  // 검증 오류
  validationError: 'CHAT_ROOM_VALIDATION_ERROR',
  invalidMessageType: 'INVALID_MESSAGE_TYPE',
  invalidReactionType: 'INVALID_REACTION_TYPE',

  // 데이터베이스 오류
  fetchError: 'CHAT_ROOM_FETCH_ERROR',
  insertError: 'CHAT_ROOM_INSERT_ERROR',
  updateError: 'CHAT_ROOM_UPDATE_ERROR',
  deleteError: 'CHAT_ROOM_DELETE_ERROR',
} as const;

export type ChatRoomServiceError =
  (typeof chatRoomErrorCodes)[keyof typeof chatRoomErrorCodes];
