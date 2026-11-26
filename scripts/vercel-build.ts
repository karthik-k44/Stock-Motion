/**
 * `npm run vercel-build` — Vercel's build command (vercel.json). Writes a Build Output API (v3) deployment:
 *
 *   .vercel/output/static/              the frontend (`npm run build`), served by Vercel's CDN
 *   .vercel/output/functions/api.func/  the backend: src/backend/server.ts bundled with esbuild, so the `@/`
 *                                       imports are resolved here rather than left to Vercel's runtime
 *   .vercel/output/config.json          routes: /api/* → the function, files → the CDN, any other path → index.html
 *
 * Migrations run before anything is written, so a new deployment never meets an older schema.
 */
import { execSync } from 'node:child_process';
import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { BundleServer } from './lib/bundle-server';

const OUT = '.vercel/output';
const FUNCTION = `${OUT}/functions/api.func`;

if (!process.env.DATABASE_URL) {
  // Vercel tells the build which environment it is for: a variable added for Production only is missing in Preview.
  const target = process.env.VERCEL_ENV ?? 'this';
  const branch = process.env.VERCEL_GIT_COMMIT_REF ? ` (branch ${process.env.VERCEL_GIT_COMMIT_REF})` : '';
  console.error(
    [
      `DATABASE_URL is not set for ${target} builds${branch}.`,
      `Add a PostgreSQL connection string (Neon or Supabase, pooled) under Settings → Environment Variables with the`,
      `"${target === 'this' ? 'right' : target}" environment ticked, then redeploy — variables only reach new deployments.`,
    ].join('\n'),
  );
  process.exit(1);
}

const run = (command: string, env: Record<string, string> = {}) =>
  execSync(command, { stdio: 'inherit', env: { ...process.env, ...env } });

// The function runs with NODE_ENV=production, where the settings are checked more strictly (JWT_SECRET is required,
// 32+ characters). A bad value would make it exit as it loads — Vercel then fails every request after a long wait,
// with nothing pointing at the cause. Check them the same way now, so the build stops and says what is wrong.
try {
  run('npx tsx --tsconfig tsconfig.node.json src/backend/config/env.ts', { NODE_ENV: 'production' });
} catch {
  console.error('Fix the environment variables above in Vercel (Settings → Environment Variables), then redeploy.');
  process.exit(1);
}
console.log('Environment variables checked for production');

rmSync(OUT, { recursive: true, force: true });
run('npm run build');
run('npm run db:migrate');
cpSync('dist', `${OUT}/static`, { recursive: true });

await BundleServer({
  outfile: `${FUNCTION}/index.mjs`,
  // Optional drivers and native add-ons that libraries try to load but this app never uses on Vercel (TypeORM's
  // other databases, ws's speed-ups, pg's native bindings, the embedded database, the dev server's Vite).
  external: [
    '@electric-sql/pglite',
    'vite',
    'pg-native',
    'pg-query-stream',
    'bufferutil',
    'utf-8-validate',
    'mysql',
    'mysql2',
    'oracledb',
    'mssql',
    'mongodb',
    'redis',
    'ioredis',
    'sql.js',
    'sqlite3',
    'better-sqlite3',
    '@sap/hana-client',
    'hdb-pool',
    '@google-cloud/spanner',
    'typeorm-aurora-data-api-driver',
    'react-native-sqlite-storage',
    '@capacitor-community/sqlite',
    'expo-sqlite',
    'ts-node',
  ],
});

const json = (path: string, value: unknown) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

json(`${FUNCTION}/.vc-config.json`, {
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  // Express parses its own bodies; Vercel's request helpers would read the stream first.
  shouldAddHelpers: false,
  shouldAddSourcemapSupport: true,
  supportsResponseStreaming: true,
  // Also the longest a realtime socket stays open before the client reconnects (the Hobby plan's maximum).
  maxDuration: 300,
  // Set on the function only, so the project needn't: NODE_ENV=production there would make the build's install
  // skip devDependencies. Vercel's proxy is the one hop in front and sets X-Forwarded-For itself, so rate limits
  // see real clients.
  environment: { NODE_ENV: 'production', TRUST_PROXY: '1' },
});

json(`${OUT}/config.json`, {
  version: 3,
  routes: [
    // Vite's hashed bundles never change.
    { src: '^/assets/(.*)$', headers: { 'cache-control': 'public, max-age=31536000, immutable' }, continue: true },
    { src: '^/api(?:/.*)?$', dest: '/api' },
    { handle: 'filesystem' },
    // The app routes in the browser: every other path loads index.html.
    { src: '^/.*$', dest: '/index.html' },
  ],
});

console.log(`Vercel build output written to ${OUT}`);
