'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { LoginResponseSchema, type LoginRequest } from '../lib/dto';
import { useChatApp } from '@/contexts/chat-app-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useCurrentUser } from './useCurrentUser';

const loginUser = async (request: LoginRequest) => {
  try {
    const { data } = await apiClient.post('/api/auth/login', request);
    return LoginResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '로그인에 실패했습니다');
    throw new Error(message);
  }
};

export const useLoginMutation = () => {
  const { actions } = useChatApp();
  const { refresh } = useCurrentUser();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      actions.signInSuccess({
        session: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
          mfaRequired: data.mfaRequired ?? false,
        },
        profile: {
          id: data.user.id,
          nickname: data.user.nickname,
          profileImageUrl: data.user.profileImageUrl,
          accountStatus: data.user.accountStatus,
        },
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Supabase 브라우저 클라이언트에 세션 설정
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.setSession({
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
      });

      // CurrentUserContext 새로고침
      await refresh();
    },
    onError: (error) => {
      console.error('Login failed:', error.message);
    },
  });
};
