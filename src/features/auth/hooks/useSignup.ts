'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  SignupRequestSchema,
  SignupResponseSchema,
  type SignupRequest,
  type SignupResponse,
} from '@/features/auth/lib/dto';

const signup = async (request: SignupRequest): Promise<SignupResponse> => {
  try {
    const { data } = await apiClient.post('/api/auth/signup', request);
    return SignupResponseSchema.parse(data.data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Signup failed');
    throw new Error(message);
  }
};

type UseSignupOptions = {
  onSuccess?: (data: SignupResponse) => void;
  onError?: (error: Error) => void;
};

export const useSignup = (options?: UseSignupOptions) => {
  const router = useRouter();

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.session.accessToken);
        localStorage.setItem('refreshToken', data.session.refreshToken);
      }

      options?.onSuccess?.(data);

      router.push('/chat');
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};
