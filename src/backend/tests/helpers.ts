import request from 'supertest';
import { CreateApp } from '@/backend/app';
import { ConnectDb, WipeDatabase } from '@/backend/db/client';
import { RunMigrations } from '@/backend/db/migrate';
import type { BusinessTypeEnum } from '@/backend/types/template';

/**
 * In-memory Postgres (PGlite), migrated once per test file. Set TEST_DATABASE_URL to run the suite against a real
 * PostgreSQL server instead (created if missing) — every table in it is emptied, so its name must contain "test".
 */
export const SetupDatabase = async () => {
  const url = process.env.TEST_DATABASE_URL || undefined;
  if (url && !/test/i.test(new URL(url).pathname)) {
    throw new Error('TEST_DATABASE_URL must point at a database with "test" in its name — the tests wipe it');
  }
  await ConnectDb({ url });
  await RunMigrations();
};

export const ResetDatabase = () => WipeDatabase();

export const app = CreateApp();

let counter = 0;

export type SessionType = { token: string; accountId: string; email: string; cookie: string };

export const SignUp = async (name = 'Test Owner'): Promise<SessionType> => {
  const email = `owner${++counter}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ name, email, password: 'correct-horse-battery' });
  if (res.status !== 201) throw new Error(`Sign-up failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.accessToken, accountId: res.body.account.id, email, cookie: RefreshCookie(res) };
};

/** The `sm_refresh=…` pair from a response's Set-Cookie header. */
export const RefreshCookie = (res: request.Response): string => {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  return (header ?? []).find((c) => c.startsWith('sm_refresh='))?.split(';')[0] ?? '';
};

export const CreateBusiness = async (token: string, type: BusinessTypeEnum, sampleData = true) => {
  const res = await request(app)
    .post('/api/businesses')
    .set('authorization', `Bearer ${token}`)
    .send({ name: `Test ${type}`, type, sampleData });
  if (res.status !== 201) throw new Error(`Create business failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { id: string; template: { orderFlow: { status: string }[] } };
};

/** Requests against `/api/businesses/:businessId/…` as one signed-in account. */
export const Client = (token: string, businessId: string) => {
  const url = (path: string) => `/api/businesses/${businessId}${path}`;
  const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);
  return {
    get: (path: string) => auth(request(app).get(url(path))),
    post: (path: string, body: object = {}) => auth(request(app).post(url(path))).send(body),
    put: (path: string, body: object) => auth(request(app).put(url(path))).send(body),
    patch: (path: string, body: object) => auth(request(app).patch(url(path))).send(body),
    delete: (path: string) => auth(request(app).delete(url(path))),
  };
};

/** A signed-up owner with one business of `type`, ready to call. */
export const OwnerWithBusiness = async (type: BusinessTypeEnum, sampleData = true) => {
  const session = await SignUp();
  const business = await CreateBusiness(session.token, type, sampleData);
  return { session, business, api: Client(session.token, business.id) };
};
