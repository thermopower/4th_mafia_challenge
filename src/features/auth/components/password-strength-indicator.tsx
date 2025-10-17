'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from '@/features/auth/lib/validators';

type PasswordStrengthIndicatorProps = {
  password: string;
  className?: string;
};

export const PasswordStrengthIndicator = ({
  password,
  className,
}: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const label = useMemo(() => getPasswordStrengthLabel(strength), [strength]);
  const color = useMemo(() => getPasswordStrengthColor(strength), [strength]);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('mt-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              strength === 0 && 'w-1/3 bg-red-500',
              strength === 1 && 'w-2/3 bg-yellow-500',
              strength === 2 && 'w-full bg-green-500'
            )}
          />
        </div>
        <span className={cn('text-sm font-medium', color)}>{label}</span>
      </div>
    </div>
  );
};
