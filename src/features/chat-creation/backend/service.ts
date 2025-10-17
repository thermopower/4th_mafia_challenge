import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure } from '@/backend/http/response';
import { chatCreationErrorCodes } from './error';
import type { CreateChatResponse } from './schema';

const fallbackAvatar = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;

export const findExistingDirectChat = async (
  supabase: SupabaseClient,
  userAId: string,
  userBId: string
) => {
  try {
    const [sortedUserA, sortedUserB] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    const { data, error } = await supabase
      .from('chat_direct_pairs')
      .select('chat_room_id')
      .eq('user_a_id', sortedUserA)
      .eq('user_b_id', sortedUserB)
      .maybeSingle();

    if (error) {
      return failure(
        500,
        chatCreationErrorCodes.createError,
        error.message
      );
    }

    if (!data) {
      return success(null, 200);
    }

    const { data: roomData } = await supabase
      .from('chat_rooms')
      .select('id, room_type, name, created_at')
      .eq('id', data.chat_room_id)
      .single();

    if (!roomData) {
      return success(200, null);
    }

    const { data: members } = await supabase
      .from('chat_members')
      .select('user_id, users(id, nickname, profile_image_url)')
      .eq('chat_room_id', roomData.id);

    const memberList =
      members?.map((m: any) => ({
        user_id: m.users?.id || '',
        nickname: m.users?.nickname || '알 수 없음',
        profile_image_url:
          m.users?.profile_image_url || fallbackAvatar(m.users?.id || ''),
      })) || [];

    const result: CreateChatResponse = {
      chat_room_id: roomData.id,
      room_type: roomData.room_type,
      name: roomData.name,
      members: memberList,
      created_at: roomData.created_at,
      exists: true,
    };

    return success(result, 200);
  } catch (error: any) {
    return failure(
      500,
      chatCreationErrorCodes.createError,
      error.message || 'Failed to check existing chat'
    );
  }
};

export const createChatRoom = async (
  supabase: SupabaseClient,
  params: {
    createdBy: string;
    type: 'direct' | 'group';
    name: string | null;
    participantIds: string[];
  }
) => {
  try {
    // 1. chat_rooms 테이블에 채팅방 생성
    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        room_type: params.type,
        name: params.name,
        created_by: params.createdBy,
      })
      .select('id, room_type, name, created_at, updated_at')
      .single();

    if (roomError || !roomData) {
      return failure(
        500,
        chatCreationErrorCodes.createError,
        roomError?.message || 'Failed to create chat room'
      );
    }

    // 2. chat_members 테이블에 참여자 추가
    const memberInserts = params.participantIds.map((userId) => ({
      chat_room_id: roomData.id,
      user_id: userId,
      joined_at: new Date().toISOString(),
    }));

    const { error: membersError } = await supabase
      .from('chat_members')
      .insert(memberInserts);

    if (membersError) {
      return failure(
        500,
        chatCreationErrorCodes.createError,
        membersError.message
      );
    }

    // 3. direct 타입이면 chat_direct_pairs 테이블에 추가
    if (params.type === 'direct' && params.participantIds.length === 2) {
      const [userA, userB] =
        params.participantIds[0] < params.participantIds[1]
          ? [params.participantIds[0], params.participantIds[1]]
          : [params.participantIds[1], params.participantIds[0]];

      const { error: pairError } = await supabase
        .from('chat_direct_pairs')
        .insert({
          chat_room_id: roomData.id,
          user_a_id: userA,
          user_b_id: userB,
        });

      if (pairError) {
        return failure(
          500,
          chatCreationErrorCodes.createError,
          pairError.message
        );
      }
    }

    // 참여자 정보 조회
    const { data: members } = await supabase
      .from('chat_members')
      .select('user_id, users(id, nickname, profile_image_url)')
      .eq('chat_room_id', roomData.id);

    const memberList =
      members?.map((m: any) => ({
        user_id: m.users?.id || '',
        nickname: m.users?.nickname || '알 수 없음',
        profile_image_url:
          m.users?.profile_image_url || fallbackAvatar(m.users?.id || ''),
      })) || [];

    const result: CreateChatResponse = {
      chat_room_id: roomData.id,
      room_type: roomData.room_type,
      name: roomData.name,
      members: memberList,
      created_at: roomData.created_at,
    };

    return success(result, 201);
  } catch (error: any) {
    return failure(
      500,
      chatCreationErrorCodes.createError,
      error.message || 'Failed to create chat room'
    );
  }
};
