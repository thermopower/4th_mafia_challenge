'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChatApp } from '@/contexts/chat-app-context';

export const useAuthRedirect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useChatApp();

  useEffect(() => {
    if (state.auth.session) {
      const redirectTo = searchParams.get('redirectedFrom') ?? '/chat';
      router.replace(redirectTo);
    }
  }, [state.auth.session, router, searchParams]);

  return {
    isAuthenticated: Boolean(state.auth.session),
  };
};
