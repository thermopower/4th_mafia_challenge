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
    // RPC 함수를 사용하여 트랜잭션으로 채팅방 생성
    // RETURNS TABLE은 배열을 반환하므로 .single() 대신 배열로 받아서 첫 번째 요소 사용
    const { data: roomDataArray, error: rpcError } = await supabase
      .rpc('create_chat_room_transactional', {
        p_created_by: params.createdBy,
        p_room_type: params.type,
        p_name: params.name,
        p_participant_ids: params.participantIds,
      });

    if (rpcError || !roomDataArray || roomDataArray.length === 0) {
      return failure(
        500,
        chatCreationErrorCodes.createError,
        rpcError?.message || 'Failed to create chat room'
      );
    }

    const roomData = roomDataArray[0] as {
      chat_room_id: string;
      room_type: 'direct' | 'group';
      name: string | null;
      created_at: string;
      updated_at: string;
    };

    // 참여자 정보 조회
    const { data: members } = await supabase
      .from('chat_members')
      .select('user_id, users(id, nickname, profile_image_url)')
      .eq('chat_room_id', roomData.chat_room_id);

    const memberList =
      members?.map((m: any) => ({
        user_id: m.users?.id || '',
        nickname: m.users?.nickname || '알 수 없음',
        profile_image_url:
          m.users?.profile_image_url || fallbackAvatar(m.users?.id || ''),
      })) || [];

    const result: CreateChatResponse = {
      chat_room_id: roomData.chat_room_id,
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
