import { existsSync } from 'node:fs';
import { z } from 'zod';

// Local settings live in `.env` (git-ignored; options listed in README.md). Real environment variables win.
// Tests never read it so they always use the in-memory database.
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST && existsSync('.env')) {
  process.loadEnvFile('.env');
}

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  /** When set, connect to this Postgres server. Otherwise an embedded Postgres (PGlite) is used. */
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  PGLITE_DIR: z.string().default('.data/pglite'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvType = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env: EnvType = parsed.data;
