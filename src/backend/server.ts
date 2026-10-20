import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { CreateApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { ConnectDb, db } from './db/client';
import { RunMigrations } from './db/migrate';
import { SeedDatabase } from './db/seed';
import { AttachRealtime, CloseRealtime } from './realtime/socket';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

const main = async () => {
  await ConnectDb({ url: env.DATABASE_URL, dataDir: env.PGLITE_DIR });
  await RunMigrations();
  // Demo login on an empty development database; production starts empty and owners sign up.
  if (env.NODE_ENV === 'development') await SeedDatabase();

  const app = CreateApp();
  const server = createServer(app);
  AttachRealtime(server);

  if (env.NODE_ENV === 'production') {
    const dist = `${ROOT}dist`;
    if (!existsSync(dist)) throw new Error('No frontend build found — run `npm run build` first');
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(`${dist}/index.html`));
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

  server.listen(env.PORT, () => {
    logger.info(`StockMotion running at http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async () => {
    logger.info('Shutting down…');
    server.close();
    await CloseRealtime();
    await db.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

main().catch((err) => {
  logger.error(`Failed to start: ${err instanceof Error ? err.message : String(err)}`);
  logger.debug('Startup error detail', err);
  process.exit(1);
});
