import type { Request, Response } from 'express';
import { Unauthorized } from '@/backend/common/errors';
import { ClearRefreshCookie, REFRESH_COOKIE, SetRefreshCookie } from '@/backend/common/utils/auth-cookie';
import { AccountOf } from '@/backend/middleware/auth.middleware';
import type { AuthSessionResponseType } from '@/backend/types/account';
import { authService, type IssuedSessionType } from '../auth.service';
import { LoginSchema, RegisterSchema, UpdateProfileSchema } from '../auth.validators';

/** The refresh token only ever travels in the httpOnly cookie, never in a response body. */
export const SendSession = (res: Response, session: IssuedSessionType, status = 200) => {
  SetRefreshCookie(res, session.refreshToken);
  const body: AuthSessionResponseType = { account: session.account, accessToken: session.accessToken };
  res.status(status).json(body);
};

export const authController = {
  Register: async (req: Request, res: Response) => {
    SendSession(res, await authService.Register(RegisterSchema.parse(req.body)), 201);
  },
  Login: async (req: Request, res: Response) => {
    SendSession(res, await authService.Login(LoginSchema.parse(req.body)));
  },
  Refresh: async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (typeof token !== 'string' || !token) throw Unauthorized('No session to resume');
    try {
      SendSession(res, await authService.Refresh(token));
    } catch (err) {
      ClearRefreshCookie(res);
      throw err;
    }
  },
  Logout: async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (typeof token === 'string' && token) await authService.Logout(token);
    ClearRefreshCookie(res);
    res.status(204).send();
  },
  Me: async (req: Request, res: Response) => {
    res.json(AccountOf(req));
  },
  UpdateProfile: async (req: Request, res: Response) => {
    res.json(await authService.UpdateProfile(AccountOf(req).id, UpdateProfileSchema.parse(req.body)));
  },
};
