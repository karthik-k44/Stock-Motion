import { InitialSchema1792368000000 } from './1792368000000-initial-schema';
import { AppendOnlyLedgers1793404800000 } from './1793404800000-append-only-ledgers';
import { RateLimits1795651200000 } from './1795651200000-rate-limits';

/**
 * Every migration, oldest first. TypeORM records what has run in `typeorm_migrations` and runs the rest on
 * start-up (`RunMigrations`). Add a file with `npm run db:migration:create -- <Name>`, then list it here.
 */
export const MIGRATIONS = [InitialSchema1792368000000, AppendOnlyLedgers1793404800000, RateLimits1795651200000];
