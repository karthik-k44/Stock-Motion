import request from 'supertest';
import { CreateApp } from '@/backend/app';
import { ConnectDb } from '@/backend/db/client';
import { RunMigrations } from '@/backend/db/migrate';
import { SeedDatabase } from '@/backend/db/seed';

/** In-memory Postgres (PGlite), migrated once per test file. */
export async function SetupDatabase() {
  await ConnectDb({});
  await RunMigrations();
}

export async function ResetData() {
  await SeedDatabase({ reset: true });
}

const app = CreateApp();

export const api = {
  get: (url: string) => request(app).get(url),
  post: (url: string, body?: object, user = 'u-jordan') => request(app).post(url).set('x-user-id', user).send(body ?? {}),
  patch: (url: string, body: object, user = 'u-jordan') => request(app).patch(url).set('x-user-id', user).send(body),
};
