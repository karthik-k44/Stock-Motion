import { Conflict, Unauthorized } from '@/backend/common/errors';
import { GenerateOpaqueToken, HashOpaqueToken, HashPassword, VerifyPassword } from '@/backend/common/utils/crypto';
import { ToIso } from '@/backend/common/utils/dates';
import { SignAccessToken } from '@/backend/common/utils/jwt';
import { env } from '@/backend/config/env';
import { db, type Queryable } from '@/backend/db/client';
import type { AccountRow } from '@/backend/db/schema';
import type { AccountResponseType } from '@/backend/types/account';
import { authRepository } from './auth.repository';
import type { LoginInput, RegisterInput, UpdateProfileInput } from './auth.validators';

export type IssuedSessionType = { account: AccountResponseType; accessToken: string; refreshToken: string };

const toAccount = (r: AccountRow): AccountResponseType => ({ id: r.id, email: r.email, name: r.name, createdAt: ToIso(r.created_at) });

async function Issue(q: Queryable, account: AccountResponseType): Promise<IssuedSessionType> {
  const refreshToken = GenerateOpaqueToken();
  await authRepository.InsertRefreshToken(q, account.id, HashOpaqueToken(refreshToken), env.REFRESH_TOKEN_DAYS);
  return { account, accessToken: SignAccessToken(account.id), refreshToken };
}

/** Create an account. Used by sign-up and by accepting an invite as a new person. */
async function CreateAccount(q: Queryable, input: RegisterInput): Promise<AccountResponseType> {
  if (await authRepository.FindAccountByEmail(q, input.email)) {
    throw Conflict('An account with this email already exists — sign in instead');
  }
  const row = await authRepository.InsertAccount(q, {
    email: input.email,
    name: input.name,
    passwordHash: await HashPassword(input.password),
  });
  return toAccount(row);
}

function Register(input: RegisterInput): Promise<IssuedSessionType> {
  return db.transaction(async (tx) => Issue(tx, await CreateAccount(tx, input)));
}

async function Login(input: LoginInput): Promise<IssuedSessionType> {
  const row = await authRepository.FindAccountByEmail(db, input.email);
  // Same message for an unknown email and a wrong password, so accounts can't be probed.
  if (!row || !(await VerifyPassword(input.password, row.password_hash))) {
    throw Unauthorized('That email and password do not match');
  }
  return Issue(db, toAccount(row));
}

/** Rotate a refresh token: the old one is revoked and a new pair issued, in one transaction. */
async function Refresh(rawToken: string): Promise<IssuedSessionType> {
  const hash = HashOpaqueToken(rawToken);
  const session = await db.transaction(async (tx) => {
    const token = await authRepository.ConsumeRefreshToken(tx, hash);
    if (!token) return null;
    const account = await FindAccount(token.account_id, tx);
    if (!account) throw Unauthorized('This account no longer exists');
    return Issue(tx, account);
  });
  if (session) return session;
  // Re-using an already rotated token suggests it was copied: end every session of that account.
  // Done outside the transaction above so the revocation isn't rolled back by the error.
  const used = await authRepository.FindRefreshToken(db, hash);
  if (used?.revoked_at) await authRepository.RevokeAllRefreshTokens(db, used.account_id);
  throw Unauthorized('Your session has ended — please sign in again');
}

async function Logout(rawToken: string): Promise<void> {
  await authRepository.RevokeRefreshToken(db, HashOpaqueToken(rawToken));
}

async function FindAccount(id: string, q: Queryable = db): Promise<AccountResponseType | null> {
  const row = await authRepository.FindAccountById(q, id);
  return row ? toAccount(row) : null;
}

async function UpdateProfile(id: string, input: UpdateProfileInput): Promise<AccountResponseType> {
  return toAccount(await authRepository.UpdateAccountName(db, id, input.name));
}

export const authService = { CreateAccount, Register, Login, Refresh, Logout, FindAccount, UpdateProfile, Issue };
