export const authErrorCodes = {
  invalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  accountInactive: 'AUTH_ACCOUNT_INACTIVE',
  accountSuspended: 'AUTH_ACCOUNT_SUSPENDED',
  accountWithdrawn: 'AUTH_ACCOUNT_WITHDRAWN',
  accountLocked: 'AUTH_ACCOUNT_LOCKED',
  mfaRequired: 'AUTH_MFA_REQUIRED',
  mfaFailed: 'AUTH_MFA_FAILED',
  validationError: 'AUTH_VALIDATION_ERROR',
  sessionCreationFailed: 'AUTH_SESSION_CREATION_FAILED',
  databaseError: 'AUTH_DATABASE_ERROR',
} as const;

type AuthErrorValue = (typeof authErrorCodes)[keyof typeof authErrorCodes];

export type AuthServiceError = AuthErrorValue;

export const signupErrorCodes = {
  emailAlreadyExists: 'EMAIL_ALREADY_EXISTS',
  invalidEmailFormat: 'INVALID_EMAIL_FORMAT',
  weakPassword: 'WEAK_PASSWORD',
  invalidNickname: 'INVALID_NICKNAME',
  termsNotAgreed: 'TERMS_NOT_AGREED',
  databaseError: 'SIGNUP_DATABASE_ERROR',
  sessionCreationFailed: 'SESSION_CREATION_FAILED',
  validationError: 'SIGNUP_VALIDATION_ERROR',
  accountWithdrawn: 'ACCOUNT_WITHDRAWN',
} as const;

type SignupErrorValue =
  (typeof signupErrorCodes)[keyof typeof signupErrorCodes];
export type SignupServiceError = SignupErrorValue;
