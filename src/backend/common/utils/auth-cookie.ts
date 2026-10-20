import type { Response } from 'express';
import { env, isProduction } from '@/backend/config/env';

export const REFRESH_COOKIE = 'sm_refresh';
/** Must match where the auth router is mounted, or the browser never sends the cookie back. */
const COOKIE_PATH = '/api/auth';

export const SetRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: COOKIE_PATH,
  });
};

export const ClearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH, sameSite: 'lax', secure: isProduction });
};
