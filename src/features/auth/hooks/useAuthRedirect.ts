'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChatApp } from '@/contexts/chat-app-context';
import { useCurrentUser } from './useCurrentUser';

export const useAuthRedirect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useChatApp();
  const { isAuthenticated: supabaseAuthenticated, isLoading } = useCurrentUser();

  useEffect(() => {
    // ChatApp Context와 Supabase 세션이 모두 동기화될 때까지 대기
    if (state.auth.session && supabaseAuthenticated && !isLoading) {
      const redirectTo = searchParams.get('redirectedFrom') ?? '/chat';
      router.replace(redirectTo);
    }
  }, [state.auth.session, supabaseAuthenticated, isLoading, router, searchParams]);

  return {
    isAuthenticated: Boolean(state.auth.session) && supabaseAuthenticated,
  };
};
