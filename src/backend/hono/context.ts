import type { Context } from 'hono';
import type { SupabaseClient } from '@supabase/supabase-js';

export type AppLogger = Pick<Console, 'info' | 'error' | 'warn' | 'debug'>;

export type AppConfig = {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
};

export type AppVariables = {
  supabase: SupabaseClient;
  logger: AppLogger;
  config: AppConfig;
  userId?: string; // withAuth 미들웨어를 거친 경우에만 설정됨
};

export type AppEnv = {
  Variables: AppVariables;
};

export type AppContext = Context<AppEnv>;

export const contextKeys = {
  supabase: 'supabase',
  logger: 'logger',
  config: 'config',
} as const;

export const getSupabase = (c: AppContext) =>
  c.get(contextKeys.supabase) as SupabaseClient;

export const getLogger = (c: AppContext) =>
  c.get(contextKeys.logger) as AppLogger;

export const getConfig = (c: AppContext) =>
  c.get(contextKeys.config) as AppConfig;

export const getUserId = (c: AppContext): string => {
  const userId = c.get('userId');
  if (!userId) {
    throw new Error('userId is not available. Ensure withAuth() middleware is applied.');
  }
  return userId;
};
