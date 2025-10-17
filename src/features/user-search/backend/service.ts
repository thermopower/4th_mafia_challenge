import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure } from '@/backend/http/response';
import { userSearchErrorCodes } from './error';
import type { UserSearchItem } from './schema';

const fallbackAvatar = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;

export const searchUsers = async (
  supabase: SupabaseClient,
  query: string,
  excludeUserId: string,
  limit: number = 20
) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nickname, profile_image_url, account_status')
      .or(`nickname.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('account_status', 'active')
      .neq('id', excludeUserId)
      .limit(limit);

    if (error) {
      return failure(500, userSearchErrorCodes.searchError, error.message);
    }

    const users: UserSearchItem[] =
      data?.map((user) => ({
        id: user.id,
        nickname: user.nickname || '알 수 없음',
        profileImageUrl: user.profile_image_url || fallbackAvatar(user.id),
        accountStatus: user.account_status || 'active',
      })) || [];

    return success({ users }, 200);
  } catch (error: any) {
    return failure(
      500,
      userSearchErrorCodes.searchError,
      error.message || 'Failed to search users'
    );
  }
};
