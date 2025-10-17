import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  type LoginResponse,
  type SignupRequest,
  type SignupResponse,
} from './schema';
import {
  authErrorCodes,
  type AuthServiceError,
  signupErrorCodes,
  type SignupServiceError,
} from './error';

const USERS_TABLE = 'users';

const fallbackAvatar = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;

export const authenticateUser = async (
  client: SupabaseClient,
  email: string,
  password: string,
  rememberMe = false,
): Promise<HandlerResult<LoginResponse, AuthServiceError, unknown>> => {
  // Use Supabase Auth signInWithPassword
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    // Map Supabase Auth errors to our error codes
    if (authError.message.includes('Invalid login credentials')) {
      return failure(
        401,
        authErrorCodes.invalidCredentials,
        '이메일 또는 비밀번호가 일치하지 않습니다',
      );
    }

    if (authError.message.includes('Email not confirmed')) {
      return failure(
        403,
        authErrorCodes.accountInactive,
        '이메일 인증이 필요합니다',
      );
    }

    return failure(
      500,
      authErrorCodes.databaseError,
      'Authentication failed',
      authError,
    );
  }

  if (!authData.user || !authData.session) {
    return failure(
      401,
      authErrorCodes.invalidCredentials,
      '로그인에 실패했습니다',
    );
  }

  // Fetch user profile from public.users
  const { data: profileData, error: profileError } = await client
    .from(USERS_TABLE)
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profileData) {
    return failure(
      500,
      authErrorCodes.databaseError,
      'Failed to fetch user profile',
      profileError,
    );
  }

  // Check account status
  if (profileData.account_status === 'inactive') {
    await client.auth.signOut();
    return failure(
      403,
      authErrorCodes.accountInactive,
      '비활성 계정입니다. 계정을 활성화하세요',
    );
  }

  if (profileData.account_status === 'suspended') {
    await client.auth.signOut();
    return failure(
      403,
      authErrorCodes.accountSuspended,
      '계정이 일시 정지되었습니다. 고객센터에 문의하세요',
    );
  }

  if (profileData.account_status === 'withdrawn') {
    await client.auth.signOut();
    return failure(
      403,
      authErrorCodes.accountWithdrawn,
      '탈퇴한 계정입니다. 재가입이 필요합니다',
    );
  }

  return success(
    {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      user: {
        id: authData.user.id,
        email: authData.user.email ?? '',
        nickname: profileData.nickname,
        profileImageUrl: profileData.profile_image_url ?? fallbackAvatar(authData.user.id),
        accountStatus: profileData.account_status,
      },
      redirectTo: '/chat',
      mfaRequired: false,
    } as LoginResponse,
    200,
  );
};

export const createUserWithSession = async (
  client: SupabaseClient,
  request: SignupRequest
): Promise<HandlerResult<SignupResponse, SignupServiceError, unknown>> => {
  // Additional validation: password cannot be same as email
  if (request.password.toLowerCase() === request.email.toLowerCase()) {
    return failure(
      400,
      signupErrorCodes.weakPassword,
      '비밀번호는 이메일과 동일할 수 없습니다.'
    );
  }

  // Use Supabase Auth signUp
  const { data: authData, error: authError } = await client.auth.signUp({
    email: request.email,
    password: request.password,
    options: {
      data: {
        nickname: request.nickname,
      },
    },
  });

  if (authError) {
    // Map Supabase Auth errors to our error codes
    if (authError.message.includes('already registered')) {
      return failure(
        409,
        signupErrorCodes.emailAlreadyExists,
        '이미 사용 중인 이메일입니다.'
      );
    }

    if (authError.message.includes('Password')) {
      return failure(
        400,
        signupErrorCodes.weakPassword,
        '비밀번호가 보안 요구사항을 충족하지 않습니다.'
      );
    }

    return failure(
      500,
      signupErrorCodes.databaseError,
      'Failed to create user account.',
      authError
    );
  }

  if (!authData.user || !authData.session) {
    return failure(
      500,
      signupErrorCodes.sessionCreationFailed,
      '회원가입은 완료되었으나 자동 로그인에 실패했습니다.',
    );
  }

  // Fetch the created profile (created by trigger)
  const { data: profileData, error: profileError } = await client
    .from(USERS_TABLE)
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profileData) {
    return failure(
      500,
      signupErrorCodes.databaseError,
      'Failed to fetch user profile.',
      profileError
    );
  }

  const response: SignupResponse = {
    user: {
      id: authData.user.id,
      email: authData.user.email ?? '',
      nickname: profileData.nickname,
      profileImageUrl: profileData.profile_image_url ?? fallbackAvatar(authData.user.id),
      accountStatus: profileData.account_status as 'active',
      createdAt: authData.user.created_at,
    },
    session: {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresAt: new Date(authData.session.expires_at! * 1000).toISOString(),
    },
  };

  return success(response);
};
