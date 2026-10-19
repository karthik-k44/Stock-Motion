import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '@/backend/config/env';

const ClaimsSchema = z.object({ sub: z.string().min(1) });

export const SignAccessToken = (accountId: string): string =>
  jwt.sign({}, env.JWT_SECRET, {
    subject: accountId,
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });

/** Returns the account id the token was issued to. Throws when the token is invalid or expired. */
export const VerifyAccessToken = (token: string): string =>
  ClaimsSchema.parse(jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })).sub;
