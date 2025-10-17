'use client';

import { AlertCircle } from 'lucide-react';

type LoginErrorMessageProps = {
  message: string | null;
};

export const LoginErrorMessage = ({ message }: LoginErrorMessageProps) => {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-300">
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <p>{message}</p>
    </div>
  );
};
