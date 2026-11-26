import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '@/backend/config/env';

const ClaimsSchema = z.object({ sub: z.string().min(1), exp: z.number().int().positive() });

export type AccessClaimsType = { accountId: string; expiresAt: number };

export const SignAccessToken = (accountId: string): string =>
  jwt.sign({}, env.JWT_SECRET, {
    subject: accountId,
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });

/** Who the token was issued to and when it expires (epoch ms). Throws when the token is invalid or expired. */
export const VerifyAccessTokenClaims = (token: string): AccessClaimsType => {
  const claims = ClaimsSchema.parse(jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }));
  return { accountId: claims.sub, expiresAt: claims.exp * 1000 };
};

/** Returns the account id the token was issued to. Throws when the token is invalid or expired. */
export const VerifyAccessToken = (token: string): string => VerifyAccessTokenClaims(token).accountId;
