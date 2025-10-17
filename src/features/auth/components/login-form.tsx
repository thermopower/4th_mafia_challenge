'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { loginFormSchema, type LoginFormValues } from '../lib/validation';
import { useLoginMutation } from '../hooks/useLoginMutation';
import { LoginErrorMessage } from './login-error-message';

export const LoginForm = () => {
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        if (data.mfaRequired) {
          router.push('/auth/mfa');
        } else {
          router.push(data.redirectTo);
        }
      },
    });
  };

  const errorMessage = loginMutation.error?.message ?? null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-6"
    >
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-200">
          이메일
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="example@email.com"
          className="bg-slate-900/70 text-slate-100"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-rose-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-200">
          비밀번호
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="bg-slate-900/70 text-slate-100"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-rose-400">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={(checked) => {
            setValue('rememberMe', checked === true);
          }}
        />
        <label htmlFor="rememberMe" className="text-sm text-slate-300">
          로그인 상태 유지
        </label>
      </div>

      <LoginErrorMessage message={errorMessage} />

      <Button
        type="submit"
        disabled={isSubmitting || loginMutation.isPending}
        className="w-full"
      >
        {isSubmitting || loginMutation.isPending ? '로그인 중...' : '로그인'}
      </Button>

      <div className="flex flex-col gap-2 text-xs text-slate-400">
        <Link href="/auth/forgot-password" className="hover:text-slate-200 underline">
          비밀번호를 잊으셨나요?
        </Link>
        <p>
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-slate-200 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </form>
  );
};
