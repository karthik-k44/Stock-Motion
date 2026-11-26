import { HashPassword } from '@/backend/common/utils/crypto';
import { PgErrorCode, UNIQUE_VIOLATION } from '@/backend/common/utils/pg-error';
import { logger } from '@/backend/config/logger';
import { db, type Queryable } from '@/backend/db/client';
import type { BusinessRow } from '@/backend/db/schema';
import { authRepository } from '@/backend/modules/auth/auth.repository';
import { LoadSampleData } from '@/backend/modules/businesses/business-setup.service';
import { businessesRepository } from '@/backend/modules/businesses/businesses.repository';
import { businessesService } from '@/backend/modules/businesses/businesses.service';
import { BusinessTypeEnum } from '@/backend/types/template';

/**
 * The one shared account that holds sample data, so anyone can try the app without filling their own account with it.
 * The login page shows these credentials. It is created on its first sign-in, in every environment.
 */
export const DEMO_ACCOUNT = { name: 'Sample Data', email: 'sampledata@gmail.com', password: 'sampledata123' } as const;

const DEMO_BUSINESSES = [
  { name: 'Harborline Supply Co.', type: BusinessTypeEnum.RETAIL, currency: 'USD' },
  { name: 'Ember & Oat Café', type: BusinessTypeEnum.CAFE, currency: 'USD' },
  { name: 'Brightwire Trades', type: BusinessTypeEnum.TRADES, currency: 'USD' },
];

/** Visitors can change anything; a sign-in after this long reloads the sample data fresh (dates move with it). */
const DEMO_LIFETIME_MS = 24 * 60 * 60 * 1000;

const IsDemoEmail = (email: string): boolean => email.trim().toLowerCase() === DEMO_ACCOUNT.email;

const isFresh = (owned: BusinessRow[]): boolean =>
  owned.length === DEMO_BUSINESSES.length && owned.every((b) => Date.now() - b.created_at.getTime() < DEMO_LIFETIME_MS);

/** Replace everything the demo account created with one freshly loaded business per template. */
const reload = async (tx: Queryable, accountId: string, owned: BusinessRow[]): Promise<void> => {
  for (const business of owned) await businessesRepository.Delete(tx, business.id);
  for (const input of DEMO_BUSINESSES) {
    const business = await businessesService.CreateIn(tx, accountId, input);
    await LoadSampleData(tx, business, accountId);
  }
  // Every sign-in to the shared account leaves a refresh token behind.
  await authRepository.DeleteDeadRefreshTokens(tx, accountId);
};

const prepare = async (): Promise<void> => {
  const existing = await authRepository.FindAccountByEmail(db, DEMO_ACCOUNT.email);
  // Hashed before the transaction, so the slow hash never holds a connection.
  const passwordHash = existing ? null : await HashPassword(DEMO_ACCOUNT.password);
  await db.transaction(async (tx) => {
    // The lock makes concurrent sign-ins wait here, so only one of them reloads.
    const account =
      (await authRepository.LockAccountByEmail(tx, DEMO_ACCOUNT.email)) ??
      (await authRepository.InsertAccount(tx, { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name, passwordHash: passwordHash! }));
    const owned = await businessesRepository.ListCreatedBy(tx, account.id);
    if (isFresh(owned)) return;
    await reload(tx, account.id, owned);
    logger.info('Loaded fresh sample data into the demo account');
  });
};

/**
 * Make sure the demo account exists with sample data less than a day old. Runs before the demo account signs in.
 * Two first-ever sign-ins at once can race to create the account: the loser just tries again and finds it.
 */
const Prepare = async (): Promise<void> => {
  try {
    await prepare();
  } catch (err) {
    if (PgErrorCode(err) !== UNIQUE_VIOLATION) throw err;
    await prepare();
  }
};

export const demoService = { IsDemoEmail, Prepare };
