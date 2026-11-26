import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CloseDb, db, WatchQueries } from '@/backend/db/client';
import { businesses } from '@/backend/db/schema';
import { LoadSampleData } from '@/backend/modules/businesses/business-setup.service';
import { DEMO_ACCOUNT } from '@/backend/modules/demo/demo.service';
import { BusinessTypeEnum } from '@/backend/types/template';
import { app, Client, CreateBusiness, ResetDatabase, SetupDatabase, SignUp } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(CloseDb);

const signInAsDemo = async () => {
  const res = await request(app).post('/api/auth/login').send({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password });
  expect(res.status).toBe(200);
  const token = res.body.accessToken as string;
  const mine = await request(app).get('/api/businesses').set('authorization', `Bearer ${token}`);
  return { token, account: res.body.account as { id: string; name: string }, businesses: mine.body as { id: string; type: string }[] };
};

/** What a visitor sees of a business's sample data, without ids or times. */
const snapshot = async (api: ReturnType<typeof Client>) => {
  const [items, orders, deliveries] = await Promise.all(['/items', '/orders', '/deliveries'].map(async (path) => (await api.get(path)).body));
  return {
    items: items.map((i: { sku: string; onHand: number; available: number }) => [i.sku, i.onHand, i.available]),
    orders: orders.map((o: { number: string; status: string; total: number }) => [o.number, o.status, o.total]),
    deliveries: deliveries.map((d: { number: string; status: string }) => [d.number, d.status]),
  };
};

describe('the shared demo account', () => {
  it('is created on its first sign-in with one sample business per template', async () => {
    const demo = await signInAsDemo();
    expect(demo.account).toMatchObject({ id: expect.stringMatching(/^ACID\d{6,}$/), name: DEMO_ACCOUNT.name });
    expect(demo.businesses.map((b) => b.type).sort()).toEqual(['CAFE', 'RETAIL', 'TRADES']);
    for (const b of demo.businesses) {
      const sample = await snapshot(Client(demo.token, b.id));
      expect(sample.items.length).toBeGreaterThan(0);
      expect(sample.orders.length).toBeGreaterThan(0);
    }
  });

  it('keeps visitors’ changes until the data is a day old, then reloads it fresh', async () => {
    const first = await signInAsDemo();
    const retail = first.businesses.find((b) => b.type === 'RETAIL')!;
    const api = Client(first.token, retail.id);
    const original = await snapshot(api);
    expect((await api.post('/customers', { name: 'A visitor was here' })).status).toBe(201);

    const second = await signInAsDemo();
    expect(second.businesses.map((b) => b.id)).toEqual(first.businesses.map((b) => b.id));
    expect((await api.get('/customers')).body.map((c: { name: string }) => c.name)).toContain('A visitor was here');

    await db.update(businesses).set({ created_at: new Date(Date.now() - 25 * 60 * 60 * 1000) });
    const third = await signInAsDemo();
    const fresh = third.businesses.find((b) => b.type === 'RETAIL')!;
    expect(fresh.id).not.toBe(retail.id);
    const freshApi = Client(third.token, fresh.id);
    expect((await freshApi.get('/customers')).body.map((c: { name: string }) => c.name)).not.toContain('A visitor was here');
    expect(await snapshot(freshApi)).toEqual(original);
  });

  it('can’t be claimed by signing up with its email, or renamed', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Me', email: DEMO_ACCOUNT.email, password: 'my-own-password' });
    expect(res.status).toBe(409);
    const demo = await signInAsDemo();
    const rename = await request(app).patch('/api/auth/me').set('authorization', `Bearer ${demo.token}`).send({ name: 'Mine now' });
    expect(rename.status).toBe(403);
  });
});

describe('everyone else', () => {
  it('starts with an empty business, even when asking for sample data', async () => {
    const owner = await SignUp();
    const res = await request(app)
      .post('/api/businesses')
      .set('authorization', `Bearer ${owner.token}`)
      .send({ name: 'Mine', type: 'RETAIL', sampleData: true });
    expect(res.status).toBe(201);
    expect((await Client(owner.token, res.body.id).get('/items')).body).toEqual([]);
  });

  it('gets ids with readable prefixes', async () => {
    const owner = await SignUp();
    const business = await CreateBusiness(owner, BusinessTypeEnum.RETAIL, false);
    expect(owner.accountId).toMatch(/^ACID\d{6,}$/);
    expect(business.id).toMatch(/^BSID\d{6,}$/);
    const customer = await Client(owner.token, business.id).post('/customers', { name: 'First Customer' });
    expect(customer.body.id).toMatch(/^CSID\d{6,}$/);
  });
});

describe('loading sample data', () => {
  it.each(Object.values(BusinessTypeEnum))('writes a %s business in a handful of statements, not one per row', async (type) => {
    const owner = await SignUp();
    const business = await CreateBusiness(owner, type, false);
    let statements = 0;
    const stop = WatchQueries(() => statements++);
    try {
      await db.transaction((tx) => LoadSampleData(tx, business, owner.accountId));
    } finally {
      stop();
    }
    // One statement per table, whatever the size of the sample (it used to be one per row: 170 for retail).
    expect(statements).toBeLessThanOrEqual(15);
  });
});
