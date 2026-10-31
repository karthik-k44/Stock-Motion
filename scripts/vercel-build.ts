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
import { build } from 'esbuild';

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

const run = (command: string) => execSync(command, { stdio: 'inherit' });

rmSync(OUT, { recursive: true, force: true });
run('npm run build');
run('npm run db:migrate');
cpSync('dist', `${OUT}/static`, { recursive: true });

await build({
  entryPoints: ['src/backend/server.ts'],
  outfile: `${FUNCTION}/index.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  tsconfig: 'tsconfig.node.json',
  sourcemap: true,
  logLevel: 'warning',
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
  // CommonJS dependencies bundled into an ES module still call require() and read __dirname.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __dirnameOf } from 'node:path';",
      'const require = __createRequire(import.meta.url);',
      'const __filename = __fileURLToPath(import.meta.url);',
      'const __dirname = __dirnameOf(__filename);',
    ].join('\n'),
  },
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
