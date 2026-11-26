import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CloseDb, db } from '@/backend/db/client';
import { subscriptions } from '@/backend/db/schema';
import { BusinessTypeEnum } from '@/backend/types/template';
import { app, Client, CreateBusiness, OwnerWithBusiness, ResetDatabase, SetupDatabase, SignUp, type SessionType } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(CloseDb);

const DAY = 86_400_000;
const billing = (s: SessionType) => request(app).get('/api/billing').set('authorization', `Bearer ${s.token}`);
const choose = (s: SessionType, plan: string, quantity = 1, interval = 'MONTHLY') =>
  request(app).post('/api/billing/checkout').set('authorization', `Bearer ${s.token}`).send({ plan, interval, quantity });
const chooseForTrial = (s: SessionType, plan: string, quantity: number, interval = 'MONTHLY') =>
  request(app).post('/api/billing/trial').set('authorization', `Bearer ${s.token}`).send({ plan, interval, quantity });
const createMany = (s: SessionType, types: string[]) =>
  request(app)
    .post('/api/businesses/batch')
    .set('authorization', `Bearer ${s.token}`)
    .send({ currency: 'INR', inventories: types.map((type, i) => ({ name: `Inventory ${i + 1}`, type })) });
const endTrial = (s: SessionType) =>
  db.update(subscriptions).set({ current_period_end: new Date(Date.now() - 1000) }).where(eq(subscriptions.account_id, s.accountId));

const signedWebhook = (body: object, eventId: string, secret = 'test-webhook-secret') => {
  const raw = JSON.stringify(body);
  return request(app)
    .post('/api/billing/webhook')
    .set('content-type', 'application/json')
    .set('x-razorpay-signature', createHmac('sha256', secret).update(raw).digest('hex'))
    .set('x-razorpay-event-id', eventId)
    .send(raw);
};

describe('the free trial', () => {
  it('starts on a new account’s first visit, with Pro’s features, for 14 days and one inventory', async () => {
    const owner = await SignUp();
    const res = await billing(owner);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      plan: { code: 'TRIAL', limits: { maxMembers: 10, reorder: true } },
      status: 'TRIALING',
      quantity: 1,
      usage: { businesses: 0, maxBusinesses: 1 },
      planChosen: false,
      nextBill: null,
      hasAccess: true,
      checkout: 'MANUAL',
    });
    const days = (new Date(res.body.currentPeriodEnd).getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(13.9);
    type Plan = { code: string; pricePerInventoryMinor: { MONTHLY: number; YEARLY: number }; currency: string };
    expect(res.body.plans.map((p: Plan) => [p.code, p.pricePerInventoryMinor, p.currency])).toEqual([
      ['STARTER', { MONTHLY: 29_900, YEARLY: 299_000 }, 'INR'],
      ['PRO', { MONTHLY: 69_900, YEARLY: 699_000 }, 'INR'],
    ]);
  });

  it('covers as many inventories as the owner chose, and bills for that many once it ends', async () => {
    const owner = await SignUp();
    const chosen = await chooseForTrial(owner, 'PRO', 3, 'YEARLY');
    expect(chosen.status).toBe(200);
    expect(chosen.body).toMatchObject({
      plan: { code: 'TRIAL' },
      quantity: 3,
      interval: 'YEARLY',
      planChosen: true,
      usage: { maxBusinesses: 3 },
      nextBill: { plan: { code: 'PRO' }, interval: 'YEARLY', quantity: 3, amountMinor: 3 * 699_000, date: chosen.body.currentPeriodEnd },
    });

    const made = await createMany(owner, ['RETAIL', 'CAFE', 'TRADES']);
    expect(made.status).toBe(201);
    expect(made.body).toHaveLength(3);
    const fourth = await request(app).post('/api/businesses').set('authorization', `Bearer ${owner.token}`).send({ name: 'Fourth', type: 'CAFE' });
    expect(fourth.body.error).toMatchObject({ code: 'PLAN_LIMIT', message: expect.stringMatching(/free trial covers 3 inventories/) });

    // Fewer than it already has isn't allowed, for the trial or at checkout.
    expect((await chooseForTrial(owner, 'PRO', 2)).body.error.message).toMatch(/at least 3/);
    expect((await choose(owner, 'PRO', 2)).status).toBe(400);
  });

  it('creates a batch of inventories all or nothing', async () => {
    const owner = await SignUp();
    await chooseForTrial(owner, 'STARTER', 2);
    expect((await createMany(owner, ['RETAIL', 'CAFE', 'TRADES'])).status).toBe(403);
    expect((await billing(owner)).body.usage.businesses).toBe(0);
  });

  it('can’t be set up again once a plan has been paid for', async () => {
    const owner = await SignUp();
    await choose(owner, 'STARTER');
    expect((await chooseForTrial(owner, 'PRO', 5)).status).toBe(400);
  });

  it('leaves the owner’s businesses read-only once it ends — for the whole team — until a plan is chosen', async () => {
    const { session, business, api } = await OwnerWithBusiness(BusinessTypeEnum.RETAIL, false);
    const invite = await api.post('/invites', { role: 'PICKER' });
    const staff = await SignUp('Staff');
    await request(app).post(`/api/invites/${invite.body.token}/accept`).set('authorization', `Bearer ${staff.token}`);
    await endTrial(session);

    expect((await api.get('/items')).status).toBe(200);
    const blocked = await api.post('/customers', { name: 'Nope' });
    expect(blocked.status).toBe(402);
    expect(blocked.body.error.code).toBe('SUBSCRIPTION_REQUIRED');
    expect((await Client(staff.token, business.id).post('/customers', { name: 'Nope' })).status).toBe(402);
    expect((await request(app).get(`/api/businesses/${business.id}`).set('authorization', `Bearer ${staff.token}`)).body.access).toEqual({
      writable: false, planName: 'Free trial', ownerIsYou: false,
    });
    expect((await billing(session)).body).toMatchObject({ status: 'TRIALING', hasAccess: false });

    expect((await choose(session, 'STARTER')).status).toBe(200);
    expect((await api.post('/customers', { name: 'Back in business' })).status).toBe(201);
  });
});

describe('plan limits', () => {
  it('keeps a plan to the inventories paid for; Starter to one person and no bulk reorder; Pro opens them up', async () => {
    const { session, api } = await OwnerWithBusiness(BusinessTypeEnum.RETAIL, false);
    expect((await choose(session, 'STARTER')).body).toMatchObject({ provider: 'MANUAL', billing: { plan: { code: 'STARTER' }, quantity: 1, status: 'ACTIVE' } });

    const second = await request(app).post('/api/businesses').set('authorization', `Bearer ${session.token}`).send({ name: 'Second', type: 'CAFE' });
    expect(second.status).toBe(403);
    expect(second.body.error).toMatchObject({ code: 'PLAN_LIMIT', message: expect.stringMatching(/plan covers one inventory/) });
    expect((await api.post('/invites', { role: 'PICKER' })).body.error.code).toBe('PLAN_LIMIT');
    expect((await api.post('/deliveries/reorder', {})).body.error.code).toBe('PLAN_LIMIT');

    await choose(session, 'PRO', 2);
    expect((await CreateBusiness(session, BusinessTypeEnum.CAFE, false)).id).toMatch(/^BSID/);
    expect((await api.post('/invites', { role: 'PICKER' })).status).toBe(201);
  });

  it('bills a year at ten months’ price, after the rest of the trial', async () => {
    const owner = await SignUp();
    const res = await choose(owner, 'PRO', 2, 'YEARLY');
    expect(res.body.billing).toMatchObject({ interval: 'YEARLY', quantity: 2, usage: { maxBusinesses: 2 } });
    // Switched on without a payment (development), it still gets an invoice, with no payment id.
    const invoices = (await request(app).get('/api/billing/invoices').set('authorization', `Bearer ${owner.token}`)).body;
    expect(invoices).toMatchObject([{ provider: 'MANUAL', paymentId: null, quantity: 2, interval: 'YEARLY', amountMinor: 2 * 699_000 }]);
    const days = (new Date(res.body.billing.currentPeriodEnd).getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(365 + 13);
    expect(days).toBeLessThan(366 + 15);
  });

  it('counts pending invites towards the team limit', async () => {
    const { session, api } = await OwnerWithBusiness(BusinessTypeEnum.RETAIL, false);
    await choose(session, 'PRO');
    for (let i = 0; i < 9; i++) expect((await api.post('/invites', { role: 'PICKER' })).status).toBe(201);
    expect((await api.post('/invites', { role: 'PICKER' })).body.error).toMatchObject({ code: 'PLAN_LIMIT', message: expect.stringMatching(/10 people/) });
  });
});

describe('cancelling', () => {
  it('keeps the paid period and stops renewing', async () => {
    const owner = await SignUp();
    expect((await request(app).post('/api/billing/cancel').set('authorization', `Bearer ${owner.token}`)).status).toBe(400);
    await choose(owner, 'PRO');
    const cancelled = await request(app).post('/api/billing/cancel').set('authorization', `Bearer ${owner.token}`);
    expect(cancelled.body).toMatchObject({ status: 'CANCELLED', cancelAtPeriodEnd: true, hasAccess: true });
  });
});

describe('Razorpay webhooks', () => {
  const subscribedOwner = async () => {
    const owner = await SignUp();
    await choose(owner, 'PRO');
    await db
      .update(subscriptions)
      .set({ provider: 'RAZORPAY', provider_subscription_id: 'sub_TEST123' })
      .where(eq(subscriptions.account_id, owner.accountId));
    return owner;
  };
  const event = (name: string, status: string, currentEnd: number) => ({
    entity: 'event',
    event: name,
    payload: { subscription: { entity: { id: 'sub_TEST123', plan_id: 'plan_X', status, current_end: currentEnd } } },
  });

  it('refuses a delivery whose signature doesn’t match', async () => {
    const res = await signedWebhook(event('subscription.charged', 'active', 2_000_000_000), 'evt_1', 'not-the-secret');
    expect(res.status).toBe(400);
  });

  it('applies a renewal, a failed charge and a halt — each event once', async () => {
    const owner = await subscribedOwner();
    expect((await signedWebhook(event('subscription.charged', 'active', 2_000_000_000), 'evt_charged')).status).toBe(200);
    expect((await billing(owner)).body).toMatchObject({ status: 'ACTIVE', currentPeriodEnd: new Date(2_000_000_000 * 1000).toISOString() });

    await signedWebhook(event('subscription.pending', 'pending', 2_000_000_000), 'evt_pending');
    expect((await billing(owner)).body).toMatchObject({ status: 'PAST_DUE', hasAccess: true });

    await signedWebhook(event('subscription.halted', 'halted', 2_000_000_000), 'evt_halted');
    expect((await billing(owner)).body).toMatchObject({ status: 'EXPIRED', hasAccess: false });

    // Razorpay retrying an event already applied changes nothing.
    await signedWebhook(event('subscription.charged', 'active', 2_100_000_000), 'evt_charged');
    expect((await billing(owner)).body.status).toBe('EXPIRED');
  });

  it('acknowledges events for subscriptions it doesn’t know', async () => {
    const res = await signedWebhook({ ...event('subscription.charged', 'active', 2_000_000_000), payload: { subscription: { entity: { id: 'sub_OTHER', plan_id: 'p', status: 'active' } } } }, 'evt_other');
    expect(res.status).toBe(200);
  });
});
