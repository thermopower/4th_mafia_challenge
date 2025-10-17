'use client';

import Image from 'next/image';
import { LoginForm } from '@/features/auth/components/login-form';
import { useAuthRedirect } from '@/features/auth/hooks/useAuthRedirect';

type LoginPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LoginPage({ params }: LoginPageProps) {
  void params;
  const { isAuthenticated } = useAuthRedirect();

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-bold text-slate-100">로그인</h1>
        <p className="text-slate-400">
          계정에 로그인하고 채팅을 시작하세요
        </p>
      </header>

      <div className="grid w-full gap-8 md:grid-cols-2">
        <LoginForm />

        <figure className="hidden md:block overflow-hidden rounded-xl border border-slate-800">
          <Image
            src="https://picsum.photos/seed/login/640/640"
            alt="로그인 이미지"
            width={640}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
