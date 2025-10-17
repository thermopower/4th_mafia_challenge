'use client';

import Link from 'next/link';
import { SignupForm } from '@/features/auth/components/signup-form';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign Up</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create a new account to start chatting
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <SignupForm />
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
