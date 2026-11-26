import { createHmac } from 'node:crypto';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '@/backend/config/env';
import { CloseDb } from '@/backend/db/client';
import { app, ResetDatabase, SetupDatabase, SignUp, type SessionType } from './helpers';

/** Test-only Razorpay keys: the API itself is replaced below, so nothing leaves this machine. */
const KEY_SECRET = 'test-key-secret';
/** Pro, one inventory, one month */
const PRO = 69_900;
const PRO_YEAR = 699_000;

beforeAll(async () => {
  await SetupDatabase();
  Object.assign(env, { RAZORPAY_KEY_ID: 'rzp_test_abcdefghijklmn', RAZORPAY_KEY_SECRET: KEY_SECRET, RAZORPAY_BILLING_MODE: 'ORDERS' });
});
afterAll(async () => {
  Object.assign(env, { RAZORPAY_KEY_ID: undefined, RAZORPAY_KEY_SECRET: undefined });
  await CloseDb();
});
beforeEach(ResetDatabase);
afterEach(() => vi.restoreAllMocks());

/** Razorpay's API, as far as these tests need it: orders are created, and each payment captured for its order. */
const fakeRazorpay = () => {
  let orders = 0;
  const amounts = new Map<string, number>();
  const payments = new Map<string, { id: string; order_id: string; amount: number; currency: string; status: string; method: string; email: string; contact: string }>();
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    if (url.endsWith('/v1/orders') && init?.method === 'POST') {
      const body = JSON.parse(String(init.body)) as { amount: number; currency: string };
      const id = `order_T${++orders}`;
      amounts.set(id, body.amount);
      return json({ id, amount: body.amount, currency: body.currency, status: 'created' });
    }
    const payment = /\/v1\/payments\/([^/]+)$/.exec(url);
    if (payment) return json(payments.get(payment[1]));
    return new Response(JSON.stringify({ error: { description: `unexpected ${url}` } }), { status: 404 });
  });
  return {
    /** The customer pays for `orderId` in Checkout (its full amount, unless told otherwise): what Checkout hands the browser, and the payment Razorpay holds. */
    pay: (orderId: string, amount = amounts.get(orderId)!) => {
      const id = `pay_${orderId}`;
      payments.set(id, { id, order_id: orderId, amount, currency: 'INR', status: 'captured', method: 'upi', email: 'payer@example.com', contact: '+919447012345' });
      const signature = createHmac('sha256', KEY_SECRET).update(`${orderId}|${id}`).digest('hex');
      return { proof: { razorpay_payment_id: id, razorpay_order_id: orderId, razorpay_signature: signature }, payment: payments.get(id)! };
    },
  };
};

const as = (s: SessionType) => ({
  checkout: (plan: string, quantity = 1, interval = 'MONTHLY') =>
    request(app).post('/api/billing/checkout').set('authorization', `Bearer ${s.token}`).send({ plan, quantity, interval }),
  verify: (body: object) => request(app).post('/api/billing/checkout/verify').set('authorization', `Bearer ${s.token}`).send(body),
  billing: () => request(app).get('/api/billing').set('authorization', `Bearer ${s.token}`),
  cancel: () => request(app).post('/api/billing/cancel').set('authorization', `Bearer ${s.token}`),
  invoices: () => request(app).get('/api/billing/invoices').set('authorization', `Bearer ${s.token}`),
  invoice: (id: string) => request(app).get(`/api/billing/invoices/${id}`).set('authorization', `Bearer ${s.token}`),
});

const addMonths = (iso: string, months: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

describe('paying period by period (Razorpay orders)', () => {
  it('charges the price per inventory × inventories, and follows on from the rest of the trial', async () => {
    const razorpay = fakeRazorpay();
    const owner = as(await SignUp());
    const trialEnd = (await owner.billing()).body.currentPeriodEnd;
    const checkout = await owner.checkout('PRO', 3);
    expect(checkout.body).toMatchObject({ provider: 'RAZORPAY', mode: 'ORDERS', orderId: 'order_T1', amountMinor: 3 * PRO, quantity: 3, interval: 'MONTHLY', currency: 'INR' });

    const paid = razorpay.pay('order_T1').proof;
    const verified = await owner.verify(paid);
    expect(verified.status).toBe(200);
    expect(verified.body).toMatchObject({
      plan: { code: 'PRO' },
      quantity: 3,
      usage: { maxBusinesses: 3 },
      status: 'ACTIVE',
      autoRenews: false,
      hasAccess: true,
      nextBill: { amountMinor: 3 * PRO, quantity: 3 },
    });
    expect(verified.body.currentPeriodEnd).toBe(addMonths(trialEnd, 1));

    // Verifying the same payment again changes nothing.
    expect((await owner.verify(paid)).body.currentPeriodEnd).toBe(verified.body.currentPeriodEnd);

    // One invoice for the payment, with what was bought, the period it covers and how it was paid.
    const invoices = (await owner.invoices()).body;
    expect(invoices).toHaveLength(1);
    expect(invoices[0]).toMatchObject({
      id: expect.stringMatching(/^IVID/),
      status: 'PAID',
      plan: { code: 'PRO', name: 'Pro' },
      interval: 'MONTHLY',
      quantity: 3,
      unitAmountMinor: PRO,
      amountMinor: 3 * PRO,
      currency: 'INR',
      provider: 'RAZORPAY',
      paymentId: 'pay_order_T1',
      orderId: 'order_T1',
      paymentMethod: 'upi',
      billedTo: { name: 'Test Owner', email: 'payer@example.com', contact: '+919447012345' },
      periodStart: trialEnd,
      periodEnd: verified.body.currentPeriodEnd,
    });
    expect((await owner.invoice(invoices[0].id)).body.id).toBe(invoices[0].id);
    // Nobody else can open it.
    expect((await as(await SignUp('Someone else')).invoice(invoices[0].id)).status).toBe(404);
    // Nothing renews by itself, so there is nothing to cancel.
    expect((await owner.cancel()).status).toBe(400);
  });

  it('charges a year at ten months’ price', async () => {
    const razorpay = fakeRazorpay();
    const owner = as(await SignUp());
    const trialEnd = (await owner.billing()).body.currentPeriodEnd;
    expect((await owner.checkout('PRO', 2, 'YEARLY')).body).toMatchObject({ amountMinor: 2 * PRO_YEAR, interval: 'YEARLY' });
    const verified = await owner.verify(razorpay.pay('order_T1').proof);
    expect(verified.body).toMatchObject({ interval: 'YEARLY', quantity: 2 });
    expect(verified.body.currentPeriodEnd).toBe(addMonths(trialEnd, 12));
  });

  it('refuses a forged signature and a payment short of the price', async () => {
    const razorpay = fakeRazorpay();
    const owner = as(await SignUp());
    await owner.checkout('PRO', 2);
    const paid = razorpay.pay('order_T1').proof;
    expect((await owner.verify({ ...paid, razorpay_signature: 'f'.repeat(64) })).status).toBe(400);
    const short = razorpay.pay('order_T1', PRO).proof;
    expect((await owner.verify(short)).status).toBe(400);
    expect((await owner.billing()).body.plan.code).toBe('TRIAL');
  });

  it('adds a period on top of the time already paid for when paying early for the same plan', async () => {
    const razorpay = fakeRazorpay();
    const owner = as(await SignUp());
    await owner.checkout('PRO');
    const first = (await owner.verify(razorpay.pay('order_T1').proof)).body.currentPeriodEnd;
    await owner.checkout('PRO');
    const renewed = await owner.verify(razorpay.pay('order_T2').proof);
    expect(renewed.body.currentPeriodEnd).toBe(addMonths(first, 1));
  });

  it('applies a payment once whether the webhook or the browser reports it first', async () => {
    const razorpay = fakeRazorpay();
    const owner = as(await SignUp());
    await owner.checkout('PRO');
    const { proof: paid, payment } = razorpay.pay('order_T1');
    const raw = JSON.stringify({ event: 'order.paid', payload: { order: { entity: { id: 'order_T1' } }, payment: { entity: payment } } });
    const webhook = await request(app)
      .post('/api/billing/webhook')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', createHmac('sha256', 'test-webhook-secret').update(raw).digest('hex'))
      .set('x-razorpay-event-id', 'evt_order_paid')
      .send(raw);
    expect(webhook.status).toBe(200);
    const afterWebhook = (await owner.billing()).body;
    expect(afterWebhook).toMatchObject({ plan: { code: 'PRO' }, status: 'ACTIVE' });

    expect((await owner.verify(paid)).body.currentPeriodEnd).toBe(afterWebhook.currentPeriodEnd);
    expect((await owner.invoices()).body).toHaveLength(1);
  });
});
