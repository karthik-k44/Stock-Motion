import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { RazorpayModeTypeEnum } from '@/backend/types/billing';

// Local settings live in `.env` (git-ignored; options listed in README.md). Real environment variables win.
// Tests and servers started with ENV_FILE=none (the end-to-end tests) skip it, so they never reach its database.
const readEnvFile = process.env.NODE_ENV !== 'test' && !process.env.VITEST && process.env.ENV_FILE !== 'none';
if (readEnvFile && existsSync('.env')) process.loadEnvFile('.env');

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    /** When set, connect to this Postgres server. Otherwise an embedded Postgres (PGlite) is used. */
    DATABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    /** The embedded database's folder, or `:memory:` for one that starts empty and is gone when the server stops. */
    PGLITE_DIR: z
      .string()
      .default('.data/pglite')
      .transform((v) => (v === ':memory:' ? undefined : v)),
    /** PostgreSQL connections per server instance. Keep it small on serverless hosts, where many instances run at once. */
    DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    /** Signs access tokens. Required in production; development and tests get a random one per process. */
    JWT_SECRET: z.preprocess(emptyToUndefined, z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional()),
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
    /**
     * Which proxies to trust for the client's IP and protocol (Express "trust proxy"): a hop count ("1" behind one
     * load balancer, as on most hosts), "true", or a list such as "loopback, 10.0.0.0/8". Rate limits and secure
     * cookies depend on it being right.
     */
    TRUST_PROXY: z
      .string()
      .default('loopback')
      .transform((v): boolean | number | string => (v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? Number(v) : v)),
    /** How long open requests and sockets get to finish when the host stops the server */
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    /**
     * Razorpay API keys (Dashboard → Account & Settings → API Keys; rzp_test_… in test mode). Without them, billing runs
     * in manual mode outside production: choosing a plan activates it at once, with no payment.
     */
    RAZORPAY_KEY_ID: z.preprocess(emptyToUndefined, z.string().regex(/^rzp_(test|live)_\w+$/, 'RAZORPAY_KEY_ID starts with rzp_test_ or rzp_live_').optional()),
    RAZORPAY_KEY_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    /** The secret set on the Razorpay webhook (Dashboard → Settings → Webhooks), used to verify every delivery. */
    RAZORPAY_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    /**
     * ORDERS: each month is a one-time payment (works on any Razorpay account). SUBSCRIPTIONS: renews by itself, once
     * Razorpay has enabled Subscriptions on the account.
     */
    RAZORPAY_BILLING_MODE: z.nativeEnum(RazorpayModeTypeEnum).default(RazorpayModeTypeEnum.ORDERS),
  })
  .superRefine((v, ctx) => {
    if (v.NODE_ENV === 'production' && !v.JWT_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'JWT_SECRET is required in production' });
    }
    if (Boolean(v.RAZORPAY_KEY_ID) !== Boolean(v.RAZORPAY_KEY_SECRET)) {
      ctx.addIssue({ code: 'custom', path: ['RAZORPAY_KEY_SECRET'], message: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET together' });
    }
  })
  .transform((v) => ({ ...v, JWT_SECRET: v.JWT_SECRET ?? randomBytes(48).toString('hex') }));

export type EnvType = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env: EnvType = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
