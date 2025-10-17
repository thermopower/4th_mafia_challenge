import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일 형식이 아닙니다')
    .max(255, '이메일은 최대 255자입니다'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자입니다')
    .max(128, '비밀번호는 최대 128자입니다'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    nickname: z.string(),
    profileImageUrl: z.string(),
    accountStatus: z.enum(['active', 'inactive', 'suspended', 'withdrawn']),
  }),
  redirectTo: z.string().default('/chat'),
  mfaRequired: z.boolean().optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const UserRowSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  password_hash: z.string(),
  nickname: z.string(),
  profile_image_url: z.string().nullable(),
  account_status: z.enum(['active', 'inactive', 'suspended', 'withdrawn']),
  login_fail_count: z.number().int().min(0),
  mfa_required: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserRow = z.infer<typeof UserRowSchema>;

export const UserSessionRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  refresh_token: z.string(),
  expires_at: z.string(),
  created_at: z.string(),
});

export type UserSessionRow = z.infer<typeof UserSessionRowSchema>;

export const SignupRequestSchema = z
  .object({
    email: z
      .string()
      .email({ message: '유효한 이메일 주소를 입력해주세요.' })
      .max(254, { message: '이메일은 최대 254자까지 입력 가능합니다.' })
      .transform((val) => val.toLowerCase()),
    password: z
      .string()
      .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
      .max(100, { message: '비밀번호는 최대 100자까지 입력 가능합니다.' })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])|(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])|(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
        { message: '영문 대소문자, 숫자, 특수문자 중 3가지 이상 조합이 필요합니다.' }
      ),
    passwordConfirm: z.string(),
    nickname: z
      .string()
      .min(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
      .max(50, { message: '닉네임은 최대 50자까지 입력 가능합니다.' })
      .regex(/^[가-힣a-zA-Z0-9\s_-]+$/, {
        message: '닉네임은 한글, 영문, 숫자, 공백, -, _ 만 사용 가능합니다.',
      }),
    termsAgreed: z.boolean().refine((val) => val === true, {
      message: '서비스 이용약관에 동의해주세요.',
    }),
    privacyAgreed: z.boolean().refine((val) => val === true, {
      message: '개인정보 처리방침에 동의해주세요.',
    }),
    marketingAgreed: z.boolean().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const SignupResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string(),
    nickname: z.string(),
    profileImageUrl: z.string(),
    accountStatus: z.enum(['active', 'inactive', 'suspended', 'withdrawn']),
    createdAt: z.string(),
  }),
  session: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresAt: z.string(),
  }),
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;

export const SessionRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  refresh_token: z.string(),
  expires_at: z.string(),
  created_at: z.string(),
  last_seen_at: z.string().nullable(),
  revoked_at: z.string().nullable(),
  updated_at: z.string(),
});

export type SessionRow = z.infer<typeof SessionRowSchema>;
