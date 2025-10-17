import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  chatRoomErrorCodes,
  type ChatRoomServiceError,
} from './error';
import type {
  InitialMessagesResponse,
  SyncMessagesResponse,
  Message,
  SendMessageRequest,
  ToggleReactionRequest,
  ToggleReactionResponse,
  DeleteMessageResponse,
  UpdateReadStatusResponse,
  Reaction,
  Attachment,
  ReplyTo,
  RoomMeta,
} from './schema';

const MESSAGES_TABLE = 'messages';
const CHAT_MEMBERS_TABLE = 'chat_members';
const MESSAGE_REACTIONS_TABLE = 'message_reactions';
const MESSAGE_ATTACHMENTS_TABLE = 'message_attachments';
const USERS_TABLE = 'users';
const CHAT_ROOMS_TABLE = 'chat_rooms';

const fallbackAvatar = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;

/**
 * 채팅방 참여 권한 확인
 */
const checkMembership = async (
  client: SupabaseClient,
  userId: string,
  roomId: string
): Promise<boolean> => {
  const { data, error } = await client
    .from(CHAT_MEMBERS_TABLE)
    .select('id')
    .eq('chat_room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return !!data;
};

/**
 * 메시지에 대한 리액션 정보 조회
 */
const getMessageReactions = async (
  client: SupabaseClient,
  messageId: string,
  currentUserId: string
): Promise<Reaction[]> => {
  const { data, error } = await client
    .from(MESSAGE_REACTIONS_TABLE)
    .select('reaction_type, user_id')
    .eq('message_id', messageId);

  if (error || !data) {
    return [];
  }

  const grouped = data.reduce(
    (acc, row) => {
      const type = row.reaction_type as 'like' | 'bookmark' | 'empathy';
      if (!acc[type]) {
        acc[type] = { count: 0, reactedByMe: false };
      }
      acc[type].count += 1;
      if (row.user_id === currentUserId) {
        acc[type].reactedByMe = true;
      }
      return acc;
    },
    {} as Record<string, { count: number; reactedByMe: boolean }>
  );

  return Object.entries(grouped).map(([reactionType, stats]) => ({
    reactionType: reactionType as 'like' | 'bookmark' | 'empathy',
    count: stats.count,
    reactedByMe: stats.reactedByMe,
  }));
};

/**
 * 메시지에 대한 첨부파일 조회
 */
const getMessageAttachments = async (
  client: SupabaseClient,
  messageId: string
): Promise<Attachment[]> => {
  const { data, error } = await client
    .from(MESSAGE_ATTACHMENTS_TABLE)
    .select('id, file_url, file_type, file_size_bytes')
    .eq('message_id', messageId);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    fileUrl: row.file_url,
    fileType: row.file_type,
    fileSizeBytes: row.file_size_bytes,
  }));
};

/**
 * 답장 대상 메시지 정보 조회
 */
const getReplyToMessage = async (
  client: SupabaseClient,
  replyToMessageId: string | null
): Promise<ReplyTo | null> => {
  if (!replyToMessageId) {
    return null;
  }

  const { data, error } = await client
    .from(MESSAGES_TABLE)
    .select(
      `
      id,
      content,
      is_deleted,
      sender:users!messages_sender_id_fkey(nickname)
    `
    )
    .eq('id', replyToMessageId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    content: data.content ?? '',
    sender: {
      nickname: (data.sender as any)?.nickname ?? 'Unknown',
    },
    isDeleted: data.is_deleted,
  };
};

/**
 * 메시지 목록을 Message 타입으로 변환
 */
const transformMessages = async (
  client: SupabaseClient,
  rows: any[],
  currentUserId: string
): Promise<Message[]> => {
  const messages: Message[] = [];

  for (const row of rows) {
    const reactions = await getMessageReactions(
      client,
      row.id,
      currentUserId
    );
    const attachments = await getMessageAttachments(client, row.id);
    const replyTo = await getReplyToMessage(client, row.reply_to_message_id);

    const sender = row.sender as any;

    messages.push({
      id: row.id,
      chatRoomId: row.chat_room_id,
      senderId: row.sender_id,
      sender: {
        nickname: sender?.nickname ?? 'Unknown',
        profileImageUrl:
          sender?.profile_image_url ?? fallbackAvatar(row.sender_id),
      },
      messageType: row.message_type,
      content: row.is_deleted ? '' : (row.content ?? ''),
      replyToMessageId: row.reply_to_message_id,
      replyTo,
      isDeleted: row.is_deleted,
      deletedAt: row.deleted_at,
      reactions,
      attachments,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  return messages;
};

/**
 * 0. 채팅방 메타데이터 조회
 */
export const getRoomMeta = async (
  client: SupabaseClient,
  userId: string,
  roomId: string
): Promise<HandlerResult<RoomMeta, ChatRoomServiceError, unknown>> => {
  // 권한 확인
  const isMember = await checkMembership(client, userId, roomId);
  if (!isMember) {
    return failure(
      403,
      chatRoomErrorCodes.notMember,
      '채팅방에 참여하지 않은 사용자입니다.'
    );
  }

  // 채팅방 정보 조회
  const { data: room, error: roomError } = await client
    .from(CHAT_ROOMS_TABLE)
    .select('id, name, room_type, created_at, updated_at')
    .eq('id', roomId)
    .maybeSingle();

  if (roomError || !room) {
    return failure(
      404,
      chatRoomErrorCodes.messageNotFound,
      '채팅방을 찾을 수 없습니다.',
      roomError
    );
  }

  // 참여자 정보 조회
  const { data: participants, error: participantsError } = await client
    .from(CHAT_MEMBERS_TABLE)
    .select('user_id, users(id, nickname, profile_image_url)')
    .eq('chat_room_id', roomId);

  if (participantsError) {
    return failure(
      500,
      chatRoomErrorCodes.fetchError,
      '참여자 정보 조회에 실패했습니다.',
      participantsError
    );
  }

  const participantList =
    participants?.map((p: any) => ({
      id: p.users?.id || '',
      nickname: p.users?.nickname || '알 수 없음',
      profileImageUrl:
        p.users?.profile_image_url || fallbackAvatar(p.users?.id || ''),
    })) || [];

  return success({
    id: room.id,
    name: room.name,
    roomType: room.room_type,
    participants: participantList,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
  });
};

/**
 * 1. 초기 메시지 로드 (최신 N개)
 */
export const getInitialMessages = async (
  client: SupabaseClient,
  userId: string,
  roomId: string,
  beforeTimestamp?: string,
  limit = 30
): Promise<
  HandlerResult<InitialMessagesResponse, ChatRoomServiceError, unknown>
> => {
  // 권한 확인
  const isMember = await checkMembership(client, userId, roomId);
  if (!isMember) {
    return failure(
      403,
      chatRoomErrorCodes.notMember,
      '채팅방에 참여하지 않은 사용자입니다.'
    );
  }

  // 메시지 조회
  let query = client
    .from(MESSAGES_TABLE)
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey(nickname, profile_image_url)
    `
    )
    .eq('chat_room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (beforeTimestamp) {
    query = query.lt('created_at', beforeTimestamp);
  }

  const { data, error } = await query;

  if (error) {
    return failure(
      500,
      chatRoomErrorCodes.fetchError,
      '메시지 조회에 실패했습니다.',
      error
    );
  }

  if (!data) {
    return success({
      messages: [],
      hasMore: false,
      oldestMessageId: null,
      newestMessageId: null,
    });
  }

  const hasMore = data.length > limit;
  const messages = hasMore ? data.slice(0, limit) : data;

  const transformed = await transformMessages(client, messages, userId);

  // 시간 순으로 정렬 (오래된 것부터)
  transformed.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return success({
    messages: transformed,
    hasMore,
    oldestMessageId: transformed[0]?.id ?? null,
    newestMessageId: transformed[transformed.length - 1]?.id ?? null,
  });
};

/**
 * 2. Polling 동기화 (신규/변경/삭제 메시지)
 */
export const syncMessages = async (
  client: SupabaseClient,
  userId: string,
  roomId: string,
  afterTimestamp: string
): Promise<
  HandlerResult<SyncMessagesResponse, ChatRoomServiceError, unknown>
> => {
  // 권한 확인
  const isMember = await checkMembership(client, userId, roomId);
  if (!isMember) {
    return failure(
      403,
      chatRoomErrorCodes.notMember,
      '채팅방에 참여하지 않은 사용자입니다.'
    );
  }

  // 신규 메시지 조회
  const { data: newData, error: newError } = await client
    .from(MESSAGES_TABLE)
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey(nickname, profile_image_url)
    `
    )
    .eq('chat_room_id', roomId)
    .gt('created_at', afterTimestamp)
    .order('created_at', { ascending: true });

  if (newError) {
    return failure(
      500,
      chatRoomErrorCodes.fetchError,
      '신규 메시지 조회에 실패했습니다.',
      newError
    );
  }

  const newMessages = await transformMessages(
    client,
    newData ?? [],
    userId
  );

  // 변경된 메시지 조회 (updated_at > afterTimestamp && created_at <= afterTimestamp)
  const { data: updatedData, error: updatedError } = await client
    .from(MESSAGES_TABLE)
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey(nickname, profile_image_url)
    `
    )
    .eq('chat_room_id', roomId)
    .lte('created_at', afterTimestamp)
    .gt('updated_at', afterTimestamp)
    .order('updated_at', { ascending: true });

  if (updatedError) {
    return failure(
      500,
      chatRoomErrorCodes.fetchError,
      '변경된 메시지 조회에 실패했습니다.',
      updatedError
    );
  }

  const updatedMessages = await transformMessages(
    client,
    updatedData ?? [],
    userId
  );

  // 삭제된 메시지 ID 목록
  const deletedMessageIds = updatedMessages
    .filter((msg) => msg.isDeleted)
    .map((msg) => msg.id);

  return success({
    newMessages,
    updatedMessages,
    deletedMessageIds,
  });
};

/**
 * 3. 메시지 전송
 */
export const sendMessage = async (
  client: SupabaseClient,
  userId: string,
  request: SendMessageRequest
): Promise<HandlerResult<Message, ChatRoomServiceError, unknown>> => {
  // 권한 확인
  const isMember = await checkMembership(
    client,
    userId,
    request.chatRoomId
  );
  if (!isMember) {
    return failure(
      403,
      chatRoomErrorCodes.notMember,
      '채팅방에 참여하지 않은 사용자입니다.'
    );
  }

  // clientMessageId로 중복 전송 방지 (멱등성)
  const { data: existingMessage } = await client
    .from(MESSAGES_TABLE)
    .select('id')
    .eq('sender_id', userId)
    .eq('content', request.content)
    .eq('chat_room_id', request.chatRoomId)
    .gte('created_at', new Date(Date.now() - 60000).toISOString())
    .maybeSingle();

  if (existingMessage) {
    return failure(
      409,
      chatRoomErrorCodes.duplicateMessage,
      '이미 전송된 메시지입니다.'
    );
  }

  // 답장인 경우 원본 메시지 존재 여부 확인
  if (request.replyToMessageId) {
    const { data: replyTarget } = await client
      .from(MESSAGES_TABLE)
      .select('id')
      .eq('id', request.replyToMessageId)
      .maybeSingle();

    if (!replyTarget) {
      return failure(
        404,
        chatRoomErrorCodes.messageNotFound,
        '답장 대상 메시지를 찾을 수 없습니다.'
      );
    }
  }

  // 메시지 삽입
  const { data: insertedMessage, error: insertError } = await client
    .from(MESSAGES_TABLE)
    .insert({
      chat_room_id: request.chatRoomId,
      sender_id: userId,
      message_type: request.messageType,
      content: request.content,
      reply_to_message_id: request.replyToMessageId ?? null,
    })
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey(nickname, profile_image_url)
    `
    )
    .single();

  if (insertError || !insertedMessage) {
    return failure(
      500,
      chatRoomErrorCodes.insertError,
      '메시지 저장에 실패했습니다.',
      insertError
    );
  }

  // 첨부파일 삽입
  if (request.attachments && request.attachments.length > 0) {
    const attachmentRows = request.attachments.map((att) => ({
      message_id: insertedMessage.id,
      file_url: att.fileUrl,
      file_type: att.fileType,
      file_size_bytes: att.fileSizeBytes,
    }));

    const { error: attError } = await client
      .from(MESSAGE_ATTACHMENTS_TABLE)
      .insert(attachmentRows);

    if (attError) {
      return failure(
        500,
        chatRoomErrorCodes.insertError,
        '첨부파일 저장에 실패했습니다.',
        attError
      );
    }
  }

  // 변환
  const transformed = await transformMessages(
    client,
    [insertedMessage],
    userId
  );

  return success(transformed[0]);
};

/**
 * 4. 리액션 토글
 */
export const toggleReaction = async (
  client: SupabaseClient,
  userId: string,
  request: ToggleReactionRequest
): Promise<
  HandlerResult<ToggleReactionResponse, ChatRoomServiceError, unknown>
> => {
  // 메시지 존재 및 삭제 상태 확인
  const { data: message, error: msgError } = await client
    .from(MESSAGES_TABLE)
    .select('id, is_deleted, chat_room_id')
    .eq('id', request.messageId)
    .maybeSingle();

  if (msgError || !message) {
    return failure(
      404,
      chatRoomErrorCodes.messageNotFound,
      '메시지를 찾을 수 없습니다.'
    );
  }

  if (message.is_deleted) {
    return failure(
      400,
      chatRoomErrorCodes.notAuthorized,
      '삭제된 메시지에는 리액션을 추가할 수 없습니다.'
    );
  }

  // 권한 확인
  const isMember = await checkMembership(client, userId, message.chat_room_id);
  if (!isMember) {
    return failure(
      403,
      chatRoomErrorCodes.notMember,
      '채팅방에 참여하지 않은 사용자입니다.'
    );
  }

  // 기존 리액션 확인
  const { data: existingReaction } = await client
    .from(MESSAGE_REACTIONS_TABLE)
    .select('message_id, user_id, reaction_type')
    .eq('message_id', request.messageId)
    .eq('user_id', userId)
    .eq('reaction_type', request.reactionType)
    .maybeSingle();

  let added = false;

  if (existingReaction) {
    // 삭제
    const { error: deleteError } = await client
      .from(MESSAGE_REACTIONS_TABLE)
      .delete()
      .eq('message_id', request.messageId)
      .eq('user_id', userId)
      .eq('reaction_type', request.reactionType);

    if (deleteError) {
      return failure(
        500,
        chatRoomErrorCodes.deleteError,
        '리액션 삭제에 실패했습니다.',
        deleteError
      );
    }

    added = false;
  } else {
    // 추가
    const { error: insertError } = await client
      .from(MESSAGE_REACTIONS_TABLE)
      .insert({
        message_id: request.messageId,
        user_id: userId,
        reaction_type: request.reactionType,
      });

    if (insertError) {
      return failure(
        500,
        chatRoomErrorCodes.insertError,
        '리액션 추가에 실패했습니다.',
        insertError
      );
    }

    added = true;
  }

  // 메시지 전체 조회
  const { data: updatedMessage, error: fetchError } = await client
    .from(MESSAGES_TABLE)
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey(nickname, profile_image_url)
    `
    )
    .eq('id', request.messageId)
    .single();

  if (fetchError || !updatedMessage) {
    return failure(
      500,
      chatRoomErrorCodes.fetchError,
      '업데이트된 메시지 조회에 실패했습니다.',
      fetchError
    );
  }

  const transformed = await transformMessages(
    client,
    [updatedMessage],
    userId
  );

  return success({
    message: transformed[0],
    added,
  });
};

/**
 * 5. 메시지 삭제 (소프트 삭제)
 */
export const deleteMessage = async (
  client: SupabaseClient,
  userId: string,
  messageId: string
): Promise<
  HandlerResult<DeleteMessageResponse, ChatRoomServiceError, unknown>
> => {
  // 메시지 소유권 확인
  const { data: message, error: msgError } = await client
    .from(MESSAGES_TABLE)
    .select('id, sender_id, is_deleted, chat_room_id')
    .eq('id', messageId)
    .maybeSingle();

  if (msgError || !message) {
    return failure(
      404,
      chatRoomErrorCodes.messageNotFound,
      '메시지를 찾을 수 없습니다.'
    );
  }

  if (message.sender_id !== userId) {
    return failure(
      403,
      chatRoomErrorCodes.notAuthorized,
      '자신의 메시지만 삭제할 수 있습니다.'
    );
  }

  // 이미 삭제된 경우 멱등성 보장
  if (message.is_deleted) {
    const { data: existing } = await client
      .from(MESSAGES_TABLE)
      .select(
        `
        *,
        sender:users!messages_sender_id_fkey(nickname, profile_image_url)
      `
      )
      .eq('id', messageId)
      .single();

    if (existing) {
      const transformed = await transformMessages(
        client,
        [existing],
        userId
      );
      return success({
        message: transformed[0],
        deletedAt: existing.deleted_at,
      });
    }
  }

  // 소프트 삭제
  const deletedAt = new Date().toISOString();
  const { data: updatedMessage, error: updateError } = await client
    .from(MESSAGES_TABLE)
    .update({
      is_deleted: true,
      deleted_at: deletedAt,
      content: '',
    })
    .eq('id', messageId)
    .select(
      `
      *,
      sender:users!messages_sender_id_fkey(nickname, profile_image_url)
    `
    )
    .single();

  if (updateError || !updatedMessage) {
    return failure(
      500,
      chatRoomErrorCodes.updateError,
      '메시지 삭제에 실패했습니다.',
      updateError
    );
  }

  const transformed = await transformMessages(
    client,
    [updatedMessage],
    userId
  );

  return success({
    message: transformed[0],
    deletedAt,
  });
};

/**
 * 6. 읽음 상태 업데이트
 */
export const updateReadStatus = async (
  client: SupabaseClient,
  userId: string,
  roomId: string,
  lastReadMessageId: string
): Promise<
  HandlerResult<UpdateReadStatusResponse, ChatRoomServiceError, unknown>
> => {
  // 권한 확인
  const isMember = await checkMembership(client, userId, roomId);
  if (!isMember) {
    return failure(
      403,
      chatRoomErrorCodes.notMember,
      '채팅방에 참여하지 않은 사용자입니다.'
    );
  }

  // 메시지 존재 확인
  const { data: message } = await client
    .from(MESSAGES_TABLE)
    .select('id')
    .eq('id', lastReadMessageId)
    .eq('chat_room_id', roomId)
    .maybeSingle();

  if (!message) {
    return failure(
      404,
      chatRoomErrorCodes.messageNotFound,
      '메시지를 찾을 수 없습니다.'
    );
  }

  const lastReadAt = new Date().toISOString();

  // chat_members 업데이트
  const { error: updateError } = await client
    .from(CHAT_MEMBERS_TABLE)
    .update({
      last_read_message_id: lastReadMessageId,
      last_read_at: lastReadAt,
    })
    .eq('chat_room_id', roomId)
    .eq('user_id', userId);

  if (updateError) {
    return failure(
      500,
      chatRoomErrorCodes.updateError,
      '읽음 상태 업데이트에 실패했습니다.',
      updateError
    );
  }

  return success({
    success: true,
    lastReadMessageId,
    lastReadAt,
  });
};
