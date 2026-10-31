import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { CreateApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { CloseDb, ConnectDb } from './db/client';
import { AttachRealtime, CloseRealtime } from './realtime/socket';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/**
 * Vercel sets `VERCEL` in every deployment. There, `npm run vercel-build` has bundled this file into one function:
 * the build already ran the migrations, Vercel's CDN serves the frontend, and Vercel starts and stops instances —
 * see startOnVercel. Everywhere else (dev, Docker, `npm start`) it is a long-running process that does it all itself.
 */
const ON_VERCEL = Boolean(process.env.VERCEL);

/**
 * On Vercel the function starts at once and connects to PostgreSQL on the first request, not during start-up: a
 * database that can't be reached then answers every request with a 503 saying why (never the password), instead of
 * the function hanging until Vercel kills it with an opaque 500. A failed attempt is retried on the next request, so a
 * brief outage doesn't stick to the instance.
 */
const startOnVercel = (): Server => {
  let connecting: Promise<unknown> | null = null;
  const ready = () =>
    (connecting ??= (async () => {
      if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set for this deployment');
      await ConnectDb({ url: env.DATABASE_URL, poolSize: env.DB_POOL_SIZE });
    })().catch((err: unknown) => {
      connecting = null;
      throw err;
    }));
  // Start connecting during the cold start, so the first request usually finds the database ready.
  ready().catch((err: unknown) => logger.error(`Database not ready: ${err instanceof Error ? err.message : String(err)}`));

  const app = express();
  app.use(async (_req, res, next) => {
    try {
      await ready();
      next();
    } catch (err) {
      res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: err instanceof Error ? err.message : String(err) } });
    }
  });
  app.use(CreateApp());
  const server = createServer(app);
  AttachRealtime(server);
  // Vercel finds the server by catching this listen() call while it loads the file (it swaps listen() out for the
  // load), then serves its requests through this same server, socket included. Exporting the server without
  // calling listen() leaves Vercel with no handler, and every /api request fails with a 500.
  return server.listen();
};

const start = async (): Promise<Server> => {
  if (ON_VERCEL) return startOnVercel();
  await ConnectDb({ url: env.DATABASE_URL, dataDir: env.PGLITE_DIR, poolSize: env.DB_POOL_SIZE });
  // Loaded only here, so the Vercel bundle never runs them (both are also command-line scripts).
  const { RunMigrations } = await import('./db/migrate');
  await RunMigrations();
  // Demo login on an empty development database; production starts empty and owners sign up.
  if (env.NODE_ENV === 'development') await (await import('./db/seed')).SeedDatabase();

  const app = CreateApp();
  const server = createServer(app);
  AttachRealtime(server);

  if (env.NODE_ENV === 'production') {
    const dist = `${ROOT}dist`;
    if (!existsSync(dist)) throw new Error('No frontend build found — run `npm run build` first');
    // Hashed bundles never change, so browsers keep them a year; other files revalidate daily,
    // and index.html every time, so a deploy is picked up on the next load.
    app.use('/assets', express.static(`${dist}/assets`, { index: false, immutable: true, maxAge: '1y', fallthrough: false }));
    app.use(express.static(dist, { index: false, maxAge: '1d' }));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.set('Cache-Control', 'no-cache').sendFile(`${dist}/index.html`));
  } else {
    // Single process in development: Vite serves the frontend with HMR on the same port.
    const { createServer: createVite } = await import('vite');
    const vite = await createVite({
      root: ROOT,
      appType: 'spa',
      server: { middlewareMode: true, hmr: { server } },
    });
    app.use(vite.middlewares);
  }

  server.on('error', (err: NodeJS.ErrnoException) => {
    logger.error(err.code === 'EADDRINUSE' ? `Port ${env.PORT} is already in use — stop the other server or set PORT` : `Server error: ${err.message}`);
    process.exit(1);
  });
  server.listen(env.PORT, () => {
    logger.info(`StockMotion running at http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Hosts send SIGTERM before replacing an instance: stop taking requests, let open ones finish, then close
  // sockets and the database. A hung connection can't hold the process past SHUTDOWN_TIMEOUT_MS.
  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    logger.info(`${signal} received — shutting down…`);
    setTimeout(() => {
      logger.warn('Shutdown timed out; exiting');
      process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS).unref();
    await CloseRealtime();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await CloseDb();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  return server;
};

process.on('unhandledRejection', (reason) => logger.error('Unhandled promise rejection', reason));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — exiting', err);
  process.exit(1);
});

/** The HTTP server (Express API + realtime socket). Vercel runs the default export; elsewhere it is already listening. */
export default await start().catch((err) => {
  logger.error(`Failed to start: ${err instanceof Error ? err.message : String(err)}`);
  logger.debug('Startup error detail', err);
  process.exit(1);
});
