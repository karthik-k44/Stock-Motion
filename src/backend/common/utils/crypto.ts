import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '@/backend/config/env';

// Tests create many accounts; the minimum cost keeps them fast without changing behaviour.
const SALT_ROUNDS = env.NODE_ENV === 'test' ? 4 : 12;

export const HashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

export const VerifyPassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash);

/** Long random opaque token for refresh tokens and invite links (not a JWT). */
export const GenerateOpaqueToken = (): string => randomBytes(32).toString('base64url');

/** SHA-256 is enough here: the tokens are already high-entropy, and only the hash is stored. */
export const HashOpaqueToken = (token: string): string => createHash('sha256').update(token).digest('hex');
