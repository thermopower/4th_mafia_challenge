import { AUTH_CONSTANTS } from '@/constants/auth';

export const calculatePasswordStrength = (password: string): number => {
  if (!password || password.length < 8) {
    return 0;
  }

  let score = 0;

  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score >= 3 && password.length >= 12) return 2;
  if (score >= 3) return 1;
  return 0;
};

export const getPasswordStrengthLabel = (strength: number): string => {
  switch (strength) {
    case 0:
      return 'Weak';
    case 1:
      return 'Medium';
    case 2:
      return 'Strong';
    default:
      return '';
  }
};

export const getPasswordStrengthColor = (strength: number): string => {
  switch (strength) {
    case 0:
      return 'text-red-500';
    case 1:
      return 'text-yellow-500';
    case 2:
      return 'text-green-500';
    default:
      return 'text-gray-400';
  }
};

export const validateNickname = (nickname: string): boolean => {
  if (!nickname) return false;
  if (nickname.length < AUTH_CONSTANTS.NICKNAME_MIN_LENGTH) return false;
  if (nickname.length > AUTH_CONSTANTS.NICKNAME_MAX_LENGTH) return false;
  if (!AUTH_CONSTANTS.NICKNAME_REGEX.test(nickname)) return false;

  const bannedWords = ['admin', 'root', 'system'];
  return !bannedWords.some((word) => nickname.toLowerCase().includes(word));
};

export const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
