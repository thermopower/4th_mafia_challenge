'use client';

import Link from 'next/link';
import { SignupForm } from '@/features/auth/components/signup-form';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white tracking-tight">회원가입</h1>
            <p className="mt-3 text-lg text-slate-300">
              새로운 계정을 만들고 채팅을 시작하세요
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm p-8 shadow-2xl">
            <SignupForm />
          </div>

          <div className="mt-6 text-center text-sm">
            <p className="text-slate-300">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-slate-100 font-semibold hover:text-white transition-colors">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
