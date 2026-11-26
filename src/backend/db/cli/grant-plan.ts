/**
 * `npm run billing:grant -- <email> <STARTER|PRO|SCALE> [months]` — give an account a plan by hand, with no payment:
 * Scale (agreed in person), a courtesy month, a fix after a support request. Without `months` it never ends.
 */
import { z } from 'zod';
import { env } from '@/backend/config/env';
import { logger } from '@/backend/config/logger';
import { CloseDb, ConnectDb, db } from '@/backend/db/client';
import { RunMigrations } from '@/backend/db/migrate';
import { authRepository } from '@/backend/modules/auth/auth.repository';
import { billingService } from '@/backend/modules/billing/billing.service';
import { PlanCodeEnum } from '@/backend/types/billing';

const Args = z.tuple([
  z.string().email('Give the account’s email first'),
  z.enum([PlanCodeEnum.STARTER, PlanCodeEnum.PRO, PlanCodeEnum.SCALE], { errorMap: () => ({ message: 'Plan is STARTER, PRO or SCALE' }) }),
  z.coerce.number().int().positive('Months is a whole number').optional(),
]);

const parsed = Args.safeParse(process.argv.slice(2));
if (!parsed.success) {
  logger.error(`${parsed.error.issues[0].message}. Usage: npm run billing:grant -- owner@example.com SCALE [months]`);
  process.exit(1);
}
const [email, plan, months] = parsed.data;

await ConnectDb({ url: env.DATABASE_URL, dataDir: env.PGLITE_DIR });
await RunMigrations();
const account = await authRepository.FindAccountByEmail(db, email.toLowerCase());
if (!account) {
  logger.error(`No account with the email ${email}`);
  await CloseDb();
  process.exit(1);
}
await billingService.Grant(account.id, plan, months ?? null);
logger.info(`${email} is on ${plan}${months ? ` for ${months} month${months === 1 ? '' : 's'}` : ' with no end date'}`);
await CloseDb();
