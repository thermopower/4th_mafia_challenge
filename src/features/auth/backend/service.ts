import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  UserRowSchema,
  type LoginResponse,
  type UserRow,
  type SignupRequest,
  type SignupResponse,
  type SessionRow,
} from './schema';
import {
  authErrorCodes,
  type AuthServiceError,
  signupErrorCodes,
  type SignupServiceError,
} from './error';

const USERS_TABLE = 'users';
const USER_SESSIONS_TABLE = 'user_sessions';
const MAX_LOGIN_ATTEMPTS = 5;
const ACCESS_TOKEN_EXPIRY_HOURS = 1;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const SALT_ROUNDS = 10;
const SESSION_EXPIRES_DAYS = 30;

const generateAccessToken = (userId: string): string => {
  const payload = {
    userId,
    type: 'access',
    exp: Date.now() + ACCESS_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

const generateRefreshToken = (): string => {
  return `refresh_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

const fallbackAvatar = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;

export const authenticateUser = async (
  client: SupabaseClient,
  email: string,
  password: string,
  rememberMe = false,
): Promise<HandlerResult<LoginResponse, AuthServiceError, unknown>> => {
  const normalizedEmail = email.toLowerCase();

  const { data: userData, error: fetchError } = await client
    .from(USERS_TABLE)
    .select('*')
    .ilike('email', normalizedEmail)
    .maybeSingle<UserRow>();

  if (fetchError) {
    return failure(
      500,
      authErrorCodes.databaseError,
      'Failed to fetch user data',
      fetchError,
    );
  }

  if (!userData) {
    return failure(
      401,
      authErrorCodes.invalidCredentials,
      '이메일 또는 비밀번호가 일치하지 않습니다',
    );
  }

  const userParse = UserRowSchema.safeParse(userData);
  if (!userParse.success) {
    return failure(
      500,
      authErrorCodes.validationError,
      'User data validation failed',
      userParse.error.format(),
    );
  }

  const user = userParse.data;

  if (user.account_status === 'inactive') {
    return failure(
      403,
      authErrorCodes.accountInactive,
      '비활성 계정입니다. 계정을 활성화하세요',
    );
  }

  if (user.account_status === 'suspended') {
    return failure(
      403,
      authErrorCodes.accountSuspended,
      '계정이 일시 정지되었습니다. 고객센터에 문의하세요',
    );
  }

  if (user.account_status === 'withdrawn') {
    return failure(
      403,
      authErrorCodes.accountWithdrawn,
      '탈퇴한 계정입니다. 재가입이 필요합니다',
    );
  }

  if (user.login_fail_count >= MAX_LOGIN_ATTEMPTS) {
    await client
      .from(USERS_TABLE)
      .update({ account_status: 'suspended' })
      .eq('id', user.id);

    return failure(
      403,
      authErrorCodes.accountLocked,
      '로그인 시도 횟수 초과로 계정이 일시 잠금되었습니다. 고객센터에 문의하거나 비밀번호 재설정을 진행하세요',
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    const newFailCount = user.login_fail_count + 1;
    await client
      .from(USERS_TABLE)
      .update({ login_fail_count: newFailCount })
      .eq('id', user.id);

    const remainingAttempts = MAX_LOGIN_ATTEMPTS - newFailCount;
    const message =
      remainingAttempts > 0
        ? `이메일 또는 비밀번호가 일치하지 않습니다 (${remainingAttempts}회 남음)`
        : '이메일 또는 비밀번호가 일치하지 않습니다';

    return failure(401, authErrorCodes.invalidCredentials, message);
  }

  await client
    .from(USERS_TABLE)
    .update({ login_fail_count: 0 })
    .eq('id', user.id);

  if (user.mfa_required) {
    return success(
      {
        accessToken: '',
        refreshToken: '',
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          profileImageUrl: user.profile_image_url ?? fallbackAvatar(user.id),
          accountStatus: user.account_status,
        },
        redirectTo: '/auth/mfa',
        mfaRequired: true,
      } as LoginResponse,
      200,
    );
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  const { error: sessionError } = await client
    .from(USER_SESSIONS_TABLE)
    .insert({
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
    });

  if (sessionError) {
    return failure(
      500,
      authErrorCodes.sessionCreationFailed,
      'Failed to create session',
      sessionError,
    );
  }

  return success(
    {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImageUrl: user.profile_image_url ?? fallbackAvatar(user.id),
        accountStatus: user.account_status,
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
  const { data: existingUser, error: checkError } = await client
    .from(USERS_TABLE)
    .select('id, account_status')
    .eq('email', request.email)
    .maybeSingle();

  if (checkError) {
    return failure(
      500,
      signupErrorCodes.databaseError,
      'Failed to check email availability.',
      checkError
    );
  }

  if (existingUser) {
    if (existingUser.account_status === 'withdrawn') {
      return failure(
        409,
        signupErrorCodes.accountWithdrawn,
        '탈퇴한 이메일입니다. 고객 지원에 문의해주세요.'
      );
    }

    return failure(
      409,
      signupErrorCodes.emailAlreadyExists,
      '이미 사용 중인 이메일입니다.'
    );
  }

  if (request.password.toLowerCase() === request.email.toLowerCase()) {
    return failure(
      400,
      signupErrorCodes.weakPassword,
      '비밀번호는 이메일과 동일할 수 없습니다.'
    );
  }

  let passwordHash: string;
  try {
    passwordHash = await bcrypt.hash(request.password, SALT_ROUNDS);
  } catch (error) {
    return failure(
      500,
      signupErrorCodes.databaseError,
      'Password hashing failed.',
      error
    );
  }

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data: newUser, error: insertError } = await client
    .from(USERS_TABLE)
    .insert({
      id: userId,
      email: request.email,
      password_hash: passwordHash,
      nickname: request.nickname,
      profile_image_url: fallbackAvatar(userId),
      account_status: 'active',
      login_fail_count: 0,
      terms_agreed_at: now,
      mfa_required: false,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single<UserRow>();

  if (insertError || !newUser) {
    return failure(
      500,
      signupErrorCodes.databaseError,
      'Failed to create user.',
      insertError
    );
  }

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRES_DAYS);

  const { data: newSession, error: sessionError } = await client
    .from(USER_SESSIONS_TABLE)
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      created_at: now,
      last_seen_at: now,
      updated_at: now,
    })
    .select()
    .single<SessionRow>();

  if (sessionError || !newSession) {
    await client.from(USERS_TABLE).delete().eq('id', userId);

    return failure(
      500,
      signupErrorCodes.sessionCreationFailed,
      'Failed to create session.',
      sessionError
    );
  }

  const accessToken = generateAccessToken(userId);

  const response: SignupResponse = {
    user: {
      id: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
      profileImageUrl: newUser.profile_image_url ?? fallbackAvatar(newUser.id),
      accountStatus: newUser.account_status as 'active',
      createdAt: newUser.created_at,
    },
    session: {
      accessToken,
      refreshToken: newSession.refresh_token,
      expiresAt: newSession.expires_at,
    },
  };

  return success(response);
};
