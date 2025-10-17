import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure } from '@/backend/http/response';
import { chatListErrorCodes } from './error';
import type { ChatRoomItem } from './schema';

const fallbackAvatar = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;

export const getChatRoomsByUserId = async (
  supabase: SupabaseClient,
  userId: string,
  since?: string,
  limit: number = 50
) => {
  try {
    let query = supabase
      .from('chat_rooms')
      .select(
        `
        id,
        room_type,
        name,
        created_at,
        updated_at,
        chat_members!inner(user_id, last_read_message_id)
      `
      )
      .eq('chat_members.user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (since) {
      query = query.gt('updated_at', since);
    }

    const { data: rooms, error: roomsError } = await query;

    if (roomsError) {
      return failure(500, chatListErrorCodes.fetchError, roomsError.message);
    }

    if (!rooms) {
      return success({
        rooms: [],
        hasMore: false,
        updatedAt: new Date().toISOString(),
      }, 200);
    }

    const roomsWithDetails = await Promise.all(
      rooms.map(async (room: any) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('id, content, message_type, sender_id, is_deleted, created_at, users(nickname)')
          .eq('chat_room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const member = Array.isArray(room.chat_members)
          ? room.chat_members.find((m: any) => m.user_id === userId)
          : null;
        const lastReadId = member?.last_read_message_id;

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_room_id', room.id)
          .neq('sender_id', userId)
          .eq('is_deleted', false)
          .gt('id', lastReadId || '00000000-0000-0000-0000-000000000000');

        const { data: participants } = await supabase
          .from('chat_members')
          .select('user_id, users(id, nickname, profile_image_url)')
          .eq('chat_room_id', room.id);

        const participantList =
          participants?.map((p: any) => ({
            id: p.users?.id || '',
            nickname: p.users?.nickname || '알 수 없음',
            profileImageUrl: p.users?.profile_image_url || fallbackAvatar(p.users?.id || ''),
          })) || [];

        return {
          id: room.id,
          type: room.room_type,
          name: room.name,
          participants: participantList,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content || '',
                type: lastMessage.message_type || 'text',
                senderId: lastMessage.sender_id,
                senderNickname: (lastMessage as any).users?.nickname || '알 수 없음',
                isDeleted: lastMessage.is_deleted || false,
                createdAt: lastMessage.created_at,
              }
            : null,
          unreadCount: unreadCount || 0,
          createdAt: room.created_at,
          updatedAt: room.updated_at,
        } as ChatRoomItem;
      })
    );

    return success({
      rooms: roomsWithDetails,
      hasMore: rooms.length === limit,
      updatedAt: new Date().toISOString(),
    }, 200);
  } catch (error: any) {
    return failure(500, chatListErrorCodes.fetchError, error.message || 'Failed to fetch chat rooms');
  }
};
