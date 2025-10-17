'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useChatApp } from '@/contexts/chat-app-context';
import { useCurrentUser } from './useCurrentUser';

export const useLogoutMutation = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { actions } = useChatApp();
  const { refresh } = useCurrentUser();

  return useMutation({
    mutationFn: async () => {
      // Supabase 세션 종료
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error('로그아웃에 실패했습니다');
      }
    },
    onSuccess: async () => {
      // localStorage 토큰 제거
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }

      // ChatAppContext 상태 초기화
      actions.signOut();

      // React Query 캐시 초기화
      queryClient.clear();

      // CurrentUserContext 새로고침
      await refresh();

      // 로그인 페이지로 리다이렉트
      router.push('/login');
    },
    onError: (error) => {
      console.error('Logout failed:', error);
    },
  });
};
