'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { SignupRequestSchema, type SignupRequest } from '@/features/auth/lib/dto';
import { useSignup } from '@/features/auth/hooks/useSignup';
import { PasswordStrengthIndicator } from './password-strength-indicator';

export const SignupForm = () => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const form = useForm<SignupRequest>({
    resolver: zodResolver(SignupRequestSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      nickname: '',
      termsAgreed: false,
      privacyAgreed: false,
      marketingAgreed: false,
    },
    mode: 'onBlur',
  });

  const { mutate: signup, isPending } = useSignup({
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message,
      });
    },
  });

  const onSubmit = (data: SignupRequest) => {
    signup(data);
  };

  const passwordValue = form.watch('password');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-100 font-semibold">이메일</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  disabled={isPending}
                  className="bg-slate-800/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-slate-400 h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-100 font-semibold">비밀번호</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="최소 8자 (대문자, 소문자, 숫자, 특수문자 중 3가지 이상)"
                    disabled={isPending}
                    className="bg-slate-800/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-slate-400 h-11"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </FormControl>
              <PasswordStrengthIndicator password={passwordValue} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passwordConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-100 font-semibold">비밀번호 확인</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    disabled={isPending}
                    className="bg-slate-800/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-slate-400 h-11"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-100 font-semibold">닉네임</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="2-50자 (문자, 숫자, 공백, -, _ 사용 가능)"
                  disabled={isPending}
                  className="bg-slate-800/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-slate-400 h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 pt-2">
          <FormField
            control={form.control}
            name="termsAgreed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <div className="leading-none">
                  <FormLabel className="text-sm font-normal text-slate-200 cursor-pointer">
                    (필수) 서비스 이용약관에 동의합니다
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="privacyAgreed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <div className="leading-none">
                  <FormLabel className="text-sm font-normal text-slate-200 cursor-pointer">
                    (필수) 개인정보 처리방침에 동의합니다
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marketingAgreed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
                <div className="leading-none">
                  <FormLabel className="text-sm font-normal text-slate-300 cursor-pointer">
                    (선택) 마케팅 정보 수신에 동의합니다
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              회원가입 중...
            </>
          ) : (
            '회원가입'
          )}
        </Button>
      </form>
    </Form>
  );
};
