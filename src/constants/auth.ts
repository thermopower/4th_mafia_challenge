import { match } from "ts-pattern";

const PUBLIC_PATHS = ["/", "/login", "/signup"] as const;
const PUBLIC_PREFIXES = ["/_next", "/api", "/favicon", "/static", "/docs", "/images"] as const;

export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const AUTH_ENTRY_PATHS = [LOGIN_PATH, SIGNUP_PATH] as const;
export const isAuthEntryPath = (
  pathname: string
): pathname is (typeof AUTH_ENTRY_PATHS)[number] =>
  AUTH_ENTRY_PATHS.includes(pathname as (typeof AUTH_ENTRY_PATHS)[number]);

export const isAuthPublicPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();

  return match(normalized)
    .when(
      (path) => PUBLIC_PATHS.some((publicPath) => publicPath === path),
      () => true
    )
    .when(
      (path) => PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix)),
      () => true
    )
    .otherwise(() => false);
};

export const shouldProtectPath = (pathname: string) => !isAuthPublicPath(pathname);

export const AUTH_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  PASSWORD_REGEX:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])|(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])|(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,

  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 50,
  NICKNAME_REGEX: /^[가-힣a-zA-Z0-9\s_-]+$/,

  EMAIL_MAX_LENGTH: 254,

  SESSION_EXPIRES_DAYS: 30,
  ACCESS_TOKEN_EXPIRES_HOURS: 1,

  BCRYPT_SALT_ROUNDS: 10,
} as const;
