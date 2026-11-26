import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import { io as connect, type Socket } from 'socket.io-client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { env } from '@/backend/config/env';
import { CloseDb } from '@/backend/db/client';
import { AttachRealtime, CloseRealtime, SESSION_EXPIRED_EVENT, SOCKET_PATH } from '@/backend/realtime/socket';
import { BusinessTypeEnum } from '@/backend/types/template';
import { app, Client, CreateBusiness, OwnerWithBusiness, ResetDatabase, SetupDatabase, SignUp } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(CloseDb);

describe('business isolation', () => {
  it('lists only my businesses and hides other businesses entirely', async () => {
    const a = await OwnerWithBusiness(BusinessTypeEnum.RETAIL);
    const b = await OwnerWithBusiness(BusinessTypeEnum.CAFE);

    const mine = await request(app).get('/api/businesses').set('authorization', `Bearer ${a.session.token}`);
    expect(mine.body.map((x: { id: string }) => x.id)).toEqual([a.business.id]);
    expect(mine.body[0]).toMatchObject({ type: 'RETAIL', role: 'OWNER' });

    // Same SKUs and numbers can't leak across businesses: B gets 404 on A's business.
    const intruder = Client(b.session.token, a.business.id);
    expect((await intruder.get('/items')).status).toBe(404);
    expect((await intruder.get('/orders/SO-10231')).status).toBe(404);
    expect((await intruder.post('/items/ELC-1001/adjustments', { mode: 'ADD', qty: 1, reason: 'FOUND' })).status).toBe(404);
    expect((await a.api.get('/items/MNU-001')).status).toBe(404); // a café SKU from B
  });

  it('gives each business its own template, numbering and sample data', async () => {
    const owner = await SignUp();
    const cafe = await CreateBusiness(owner, BusinessTypeEnum.CAFE);
    const trades = await CreateBusiness(owner, BusinessTypeEnum.TRADES, false);
    expect(cafe.template.orderFlow.map((s) => s.status)).toEqual(['NEW', 'PREPARING', 'SERVED']);

    const empty = Client(owner.token, trades.id);
    expect((await empty.get('/items')).body).toEqual([]);
    expect((await empty.get('/locations')).body.map((l: { code: string }) => l.code)).toContain('VAN1-2');
    const job = await empty.post('/customers', { name: 'First Client' });
    const created = await empty.post('/orders', { customerId: job.body.id, lines: [] });
    expect(created.status).toBe(400); // needs lines; there is nothing to sell yet
  });
});

describe('team, roles and invites', () => {
  it('invites a picker who can work orders but not edit the catalogue', async () => {
    const owner = await OwnerWithBusiness(BusinessTypeEnum.RETAIL);
    expect((await owner.api.post('/invites', { role: 'NOT_A_ROLE' })).status).toBe(400);
    const invite = await owner.api.post('/invites', { role: 'PICKER' });
    expect(invite.status).toBe(201);
    const token = invite.body.token as string;

    const preview = await request(app).get(`/api/invites/${token}`);
    expect(preview.body).toMatchObject({ businessName: 'Test RETAIL', role: 'PICKER', roleLabel: 'Picker' });

    const joined = await request(app)
      .post(`/api/invites/${token}/register`)
      .send({ name: 'Priya Nair', email: 'priya@example.com', password: 'picker-password' });
    expect(joined.status).toBe(201);
    const picker = Client(joined.body.accessToken, owner.business.id);

    expect((await picker.get('/items')).status).toBe(200);
    expect((await picker.post('/orders/SO-10232/advance', { to: 'PICKING' })).status).toBe(200);
    const create = await picker.post('/items', { sku: 'NEW-1', name: 'Nope', category: 'OFFICE', unit: 'ea' });
    expect(create.status).toBe(403);
    expect((await picker.post('/invites', { role: 'PICKER' })).status).toBe(403);

    const members = await owner.api.get('/members');
    expect(members.body.map((m: { name: string; role: string }) => [m.name, m.role])).toEqual([
      ['Test Owner', 'OWNER'],
      ['Priya Nair', 'PICKER'],
    ]);
    // The link only works once.
    expect((await request(app).post(`/api/invites/${token}/register`).send({ name: 'Z', email: 'z@example.com', password: 'z-password-1' })).status).toBe(409);
  });

  it('lets an existing account accept, and protects the last owner', async () => {
    const owner = await OwnerWithBusiness(BusinessTypeEnum.TRADES);
    const other = await SignUp('Sam Tech');
    const invite = await owner.api.post('/invites', { role: 'TECHNICIAN' });
    const accepted = await request(app).post(`/api/invites/${invite.body.token}/accept`).set('authorization', `Bearer ${other.token}`);
    expect(accepted.body).toMatchObject({ id: owner.business.id, role: 'TECHNICIAN' });

    expect((await owner.api.delete(`/members/${owner.session.accountId}`)).status).toBe(409);
    expect((await owner.api.patch(`/members/${owner.session.accountId}`, { role: 'MANAGER' })).status).toBe(409);
    const tech = Client(other.token, owner.business.id);
    expect((await tech.delete(`/members/${owner.session.accountId}`)).status).toBe(403);
    expect((await tech.delete(`/members/${other.accountId}`)).status).toBe(200); // leaving is always allowed
    expect((await tech.get('/items')).status).toBe(404);
  });
});

describe('realtime', () => {
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

  const open = (token: string) => {
    const socket = connect(url, { auth: { token }, path: SOCKET_PATH, transports: ['websocket'], reconnection: false });
    sockets.push(socket);
    return socket;
  };
  const join = (socket: Socket, businessId: string) =>
    new Promise<boolean>((resolve) => socket.emit('business:join', businessId, resolve));

  it('refuses unauthenticated sockets and rooms of other businesses', async () => {
    const a = await OwnerWithBusiness(BusinessTypeEnum.RETAIL, false);
    const b = await OwnerWithBusiness(BusinessTypeEnum.RETAIL, false);

    const anonymous = open('');
    await expect(new Promise((_, reject) => anonymous.on('connect_error', reject))).rejects.toThrow('UNAUTHORIZED');

    const socket = open(a.session.token);
    expect(await join(socket, a.business.id)).toBe(true);
    expect(await join(socket, b.business.id)).toBe(false);

    const events: string[] = [];
    socket.on('data:changed', (e: { businessId: string }) => events.push(e.businessId));
    await b.api.post('/customers', { name: 'Only B sees this' });
    await a.api.post('/customers', { name: 'A sees this' });
    await new Promise((r) => setTimeout(r, 150));
    expect(events).toEqual([a.business.id]);
  });

  it('closes a socket when its access token expires, as REST calls would refuse it', async () => {
    const owner = await SignUp();
    const shortLived = jwt.sign({}, env.JWT_SECRET, { subject: owner.accountId, algorithm: 'HS256', expiresIn: 1 });
    const socket = open(shortLived);
    await new Promise<void>((resolve) => socket.on('connect', () => resolve()));
    const told = new Promise((resolve) => socket.on(SESSION_EXPIRED_EVENT, resolve));
    const closed = new Promise<string>((resolve) => socket.on('disconnect', resolve));
    await told;
    expect(await closed).toBe('io server disconnect');
  });
});
