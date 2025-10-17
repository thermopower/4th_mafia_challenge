import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('이메일 형식이 올바르지 않습니다')
    .max(255, '이메일은 최대 255자입니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 최소 8자입니다')
    .max(128, '비밀번호는 최대 128자입니다'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
