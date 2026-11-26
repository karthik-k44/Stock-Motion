import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as connect, type Socket } from 'socket.io-client';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CloseDb, db } from '@/backend/db/client';
import { ErrorHandler } from '@/backend/middleware/error.middleware';
import { RateLimitWrites } from '@/backend/middleware/rate-limit.middleware';
import { AttachRealtime, CloseRealtime, SOCKET_PATH } from '@/backend/realtime/socket';
import { BusinessTypeEnum } from '@/backend/types/template';
import { app, Client, OwnerWithBusiness, ResetDatabase, SetupDatabase } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(CloseDb);

const SKU = 'LAST-1';

/** An empty retail business with one product, `onHand` of it on the shelf. */
const shop = async (onHand: number) => {
  const owner = await OwnerWithBusiness(BusinessTypeEnum.RETAIL, false);
  const item = await owner.api.post('/items', { sku: SKU, name: 'Last One', category: 'OFFICE', unit: 'ea', onHand, price: 10 });
  expect(item.status).toBe(201);
  return owner;
};

let staffCount = 0;

/** Someone joins the owner's business with `role` through an invite link. */
const join = async (owner: Awaited<ReturnType<typeof shop>>, role: string) => {
  const invite = await owner.api.post('/invites', { role });
  expect(invite.status).toBe(201);
  const res = await request(app)
    .post(`/api/invites/${invite.body.token}/register`)
    .send({ name: `Staff ${++staffCount}`, email: `staff${staffCount}@example.com`, password: 'staff-password-1' });
  expect(res.status).toBe(201);
  return { api: Client(res.body.accessToken, owner.business.id), token: res.body.accessToken as string, accountId: res.body.account.id as string };
};

const order = async (api: Awaited<ReturnType<typeof shop>>['api'], qty: number) => {
  const res = await api.post('/orders', { customerName: 'Walk-in', lines: [{ sku: SKU, qty }] });
  expect(res.status).toBe(201);
  return res.body.number as string;
};

const delivery = async (api: Awaited<ReturnType<typeof shop>>['api'], expected: number) => {
  const res = await api.post('/deliveries', { supplierName: 'Acme Supply', expectedAt: new Date().toISOString(), lines: [{ sku: SKU, expected }] });
  expect(res.status).toBe(201);
  return res.body.number as string;
};

const statuses = (responses: { status: number }[]) => responses.map((r) => r.status).sort();

describe('stock integrity under concurrency', () => {
  it('two orders racing for the last unit: one is reserved, the other refused', async () => {
    const { api } = await shop(1);
    const [a, b] = [await order(api, 1), await order(api, 1)];
    const results = await Promise.all([a, b].map((n) => api.post(`/orders/${n}/advance`, { to: 'PICKING' })));
    expect(statuses(results)).toEqual([200, 409]);
    expect((await api.get(`/items/${SKU}`)).body).toMatchObject({ onHand: 1, reserved: 1, available: 0 });
  });

  it('closes an order, and counts its revenue, exactly once', async () => {
    const { api } = await shop(5);
    const number = await order(api, 2);
    await api.post(`/orders/${number}/advance`, { to: 'PICKING' });
    await api.post(`/orders/${number}/consume`);
    await api.post(`/orders/${number}/advance`, { to: 'PACKED' });
    const results = await Promise.all([1, 2].map(() => api.post(`/orders/${number}/advance`, { to: 'SHIPPED' })));
    expect(statuses(results)).toEqual([200, 409]);
    const { kpis } = (await api.get('/dashboard')).body;
    expect(kpis).toMatchObject({ closedToday: 1, revenueToday: 20 });
    expect((await api.get(`/items/${SKU}`)).body).toMatchObject({ onHand: 3, reserved: 0 });
  });

  it('receives a delivery once, however many times the request is sent', async () => {
    const { api } = await shop(1);
    const number = await delivery(api, 4);
    const results = await Promise.all([1, 2].map(() => api.post(`/deliveries/${number}/receive`)));
    expect(statuses(results)).toEqual([200, 409]);
    expect((await api.get(`/items/${SKU}`)).body.onHand).toBe(5);
  });

  it('refuses a stock count taken against numbers that have since changed', async () => {
    const { api } = await shop(10);
    const stale = await api.post(`/items/${SKU}/adjustments`, { mode: 'SET', qty: 7, reason: 'CYCLE_COUNT', expectedOnHand: 9 });
    expect(stale.status).toBe(409);
    const fresh = await api.post(`/items/${SKU}/adjustments`, { mode: 'SET', qty: 7, reason: 'CYCLE_COUNT', expectedOnHand: 10 });
    expect(fresh.body.onHand).toBe(7);
  });
});

describe('permissions', () => {
  it('staff cannot raise their own role, invite owners or import', async () => {
    const owner = await shop(1);
    const picker = await join(owner, 'PICKER');
    const manager = await join(owner, 'MANAGER');
    expect((await picker.api.patch(`/members/${picker.accountId}`, { role: 'OWNER' })).status).toBe(403);
    expect((await manager.api.patch(`/members/${manager.accountId}`, { role: 'OWNER' })).status).toBe(403);
    expect((await manager.api.post('/invites', { role: 'OWNER' })).status).toBe(403);
    expect((await picker.api.post('/invites', { role: 'MANAGER' })).status).toBe(403);
    expect((await picker.api.post('/imports/items', { csv: 'sku,name,category\nX-1,X,OFFICE' })).status).toBe(403);
    expect((await picker.api.post(`/orders/${await order(owner.api, 1)}/cancel`)).status).toBe(403);
    const members = (await owner.api.get('/members')).body as { role: string }[];
    expect(members.map((m) => m.role)).toEqual(['OWNER', 'PICKER', 'MANAGER']);
  });

  it('only a manager can receive more than a delivery expected', async () => {
    const owner = await shop(0);
    const receiving = await join(owner, 'RECEIVING');
    const first = await delivery(owner.api, 4);
    const over = await receiving.api.post(`/deliveries/${first}/receive`, { lines: [{ sku: SKU, received: 40 }] });
    expect(over.status).toBe(403);
    expect((await receiving.api.post(`/deliveries/${first}/receive`, { lines: [{ sku: SKU, received: 3 }] })).status).toBe(200);
    const second = await delivery(owner.api, 4);
    expect((await owner.api.post(`/deliveries/${second}/receive`, { lines: [{ sku: SKU, received: 6 }] })).status).toBe(200);
    expect((await owner.api.get(`/items/${SKU}`)).body.onHand).toBe(9);
  });

  it('a revoked invite link no longer works', async () => {
    const owner = await shop(1);
    const invite = await owner.api.post('/invites', { role: 'PICKER' });
    expect((await owner.api.delete(`/invites/${invite.body.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/invites/${invite.body.token}`)).status).toBe(404);
    const register = await request(app)
      .post(`/api/invites/${invite.body.token}/register`)
      .send({ name: 'Late', email: 'late@example.com', password: 'late-password-1' });
    expect(register.status).toBe(404);
  });

  it("another business's records can't be read or changed by guessing their ids", async () => {
    const a = await shop(1);
    const b = await OwnerWithBusiness(BusinessTypeEnum.RETAIL, false);
    await b.api.post('/items', { sku: 'B-ONLY', name: 'Private', category: 'OFFICE', unit: 'ea', onHand: 3 });
    const intruder = Client(a.session.token, b.business.id);
    expect((await intruder.get('/items/B-ONLY')).status).toBe(404);
    expect((await intruder.post('/items/B-ONLY/adjustments', { mode: 'ADD', qty: 1, reason: 'FOUND' })).status).toBe(404);
    expect((await intruder.get('/customers')).status).toBe(404);
    expect((await b.api.get('/items/B-ONLY')).body.onHand).toBe(3);
  });

  it('history cannot be rewritten, even directly in the database', async () => {
    const { api } = await shop(1);
    await api.post(`/items/${SKU}/adjustments`, { mode: 'ADD', qty: 2, reason: 'FOUND' });
    await expect(db.query(`UPDATE activity SET message = 'rewritten'`)).rejects.toThrow(/append-only/);
    await expect(db.query('UPDATE movements SET delta = 99')).rejects.toThrow(/append-only/);
    // Deleting is still possible: an owner can reset a business's data, history included.
    expect((await api.post('/reset', { sampleData: false })).status).toBe(200);
    expect((await api.get('/activity')).body).toHaveLength(1);
  });

  it('the activity log is read-only through the API', async () => {
    const { api } = await shop(1);
    const log = (await api.get('/activity')).body as { id: number }[];
    expect(log.length).toBeGreaterThan(0);
    expect((await api.patch(`/activity/${log[0].id}`, { message: 'rewritten' })).status).toBe(404);
    expect((await api.delete(`/activity/${log[0].id}`)).status).toBe(404);
  });
});

describe('realtime access', () => {
  let server: Server;
  let url = '';
  const sockets: Socket[] = [];

  beforeAll(async () => {
    server = createServer(app);
    AttachRealtime(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    url = `http://localhost:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    sockets.forEach((s) => s.close());
    await CloseRealtime();
    await new Promise((resolve) => server.close(resolve));
  });

  const settle = () => new Promise((r) => setTimeout(r, 150));

  it('a removed team member stops receiving the business’s changes at once', async () => {
    const owner = await shop(1);
    const picker = await join(owner, 'PICKER');
    const socket = connect(url, { auth: { token: picker.token }, path: SOCKET_PATH, transports: ['websocket'], reconnection: false });
    sockets.push(socket);
    const joinBusiness = () => new Promise<boolean>((resolve) => socket.emit('business:join', owner.business.id, resolve));
    expect(await joinBusiness()).toBe(true);

    let events = 0;
    socket.on('data:changed', () => events++);
    await owner.api.post('/customers', { name: 'Before' });
    await settle();
    expect(events).toBe(1);

    expect((await owner.api.delete(`/members/${picker.accountId}`)).status).toBe(200);
    await owner.api.post('/customers', { name: 'After' });
    await settle();
    expect(events).toBe(1);
    expect(await joinBusiness()).toBe(false);
  });
});

describe('rate limits', () => {
  /** One server instance: its own Express app and its own limiter, as on a serverless host. */
  const instance = (shared: boolean) => {
    const app = express();
    app.post('/login', RateLimitWrites({ name: 'test-login', windowMs: 60_000, max: 3, shared }), (_req, res) => {
      res.json({ ok: true });
    });
    app.use(ErrorHandler);
    return app;
  };

  it('counts sign-in attempts across every server instance when shared', async () => {
    const instances = [instance(true), instance(true), instance(true)];
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) statuses.push((await request(instances[i % 3]).post('/login')).status);
    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  it('starts a fresh window once the old one has passed', async () => {
    const app = instance(true);
    for (let i = 0; i < 3; i++) await request(app).post('/login');
    expect((await request(app).post('/login')).status).toBe(429);
    await db.query(`UPDATE rate_limits SET reset_at = now() - interval '1 second'`);
    expect((await request(app).post('/login')).status).toBe(200);
  });

  it('only counts within one instance when kept in memory', async () => {
    const [a, b] = [instance(false), instance(false)];
    for (let i = 0; i < 3; i++) expect((await request(a).post('/login')).status).toBe(200);
    expect((await request(a).post('/login')).status).toBe(429);
    expect((await request(b).post('/login')).status).toBe(200);
  });
});
