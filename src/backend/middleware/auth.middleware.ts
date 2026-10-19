import type { NextFunction, Request, Response } from 'express';
import { Unauthorized } from '@/backend/common/errors';
import { VerifyAccessToken } from '@/backend/common/utils/jwt';
import { authService } from '@/backend/modules/auth/auth.service';
import type { AccountResponseType } from '@/backend/types/account';

/** Reads `Authorization: Bearer <access token>` and loads the account into `req.account`. */
export async function RequireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return next(Unauthorized());
  let accountId: string;
  try {
    accountId = VerifyAccessToken(header.slice('Bearer '.length));
  } catch {
    return next(Unauthorized('Your session has expired — please sign in again'));
  }
  const account = await authService.FindAccount(accountId);
  if (!account) return next(Unauthorized('This account no longer exists'));
  req.account = account;
  next();
}

export function AccountOf(req: Request): AccountResponseType {
  if (!req.account) throw Unauthorized();
  return req.account;
}
