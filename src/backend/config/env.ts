import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { z } from 'zod';

// Local settings live in `.env` (git-ignored; options listed in README.md). Real environment variables win.
// Tests never read it so they always use the in-memory database.
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST && existsSync('.env')) {
  process.loadEnvFile('.env');
}

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    /** When set, connect to this Postgres server. Otherwise an embedded Postgres (PGlite) is used. */
    DATABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
    PGLITE_DIR: z.string().default('.data/pglite'),
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
  })
  .superRefine((v, ctx) => {
    if (v.NODE_ENV === 'production' && !v.JWT_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'JWT_SECRET is required in production' });
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
