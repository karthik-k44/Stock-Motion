import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CloseDb, DataSourceOf } from '@/backend/db/client';
import { BusinessTypeEnum } from '@/backend/types/template';
import { CreateBusiness, OwnerWithBusiness, ResetDatabase, SetupDatabase, SignUp } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(CloseDb);

/** Every SQL statement sent while `fn` runs. On a hosted database each one is a network round trip. */
const countQueries = async (fn: () => Promise<unknown>): Promise<number> => {
  const runner = Object.getPrototypeOf(DataSourceOf().createQueryRunner());
  const spy = vi.spyOn(runner, 'query');
  try {
    await fn();
    return spy.mock.calls.length;
  } finally {
    spy.mockRestore();
  }
};

/** What a person sees of the sample data, without ids or times (which differ per business by design). */
const snapshot = async (api: Awaited<ReturnType<typeof OwnerWithBusiness>>['api']) => {
  const [items, orders, deliveries, customers, suppliers] = await Promise.all(
    ['/items', '/orders', '/deliveries', '/customers', '/suppliers'].map(async (path) => (await api.get(path)).body),
  );
  return {
    items: items.map((i: { sku: string; onHand: number; reserved: number; available: number }) => [i.sku, i.onHand, i.reserved, i.available]),
    orders: orders.map((o: { number: string; status: string; total: number }) => [o.number, o.status, o.total]),
    deliveries: deliveries.map((d: { number: string; status: string; totalExpected: number }) => [d.number, d.status, d.totalExpected]),
    customers: customers.map((c: { name: string }) => c.name).sort(),
    suppliers: suppliers.map((s: { name: string }) => s.name).sort(),
  };
};

describe('setting up a business with sample data', () => {
  it.each(Object.values(BusinessTypeEnum))('writes a %s business in a handful of statements, not one per row', async (type) => {
    const owner = await SignUp();
    // It used to take one statement per row (170 for retail): seconds of round trips on a hosted database, long
    // enough for sign-up to time out. Now it is one per table, whatever the size of the sample.
    expect(await countQueries(() => CreateBusiness(owner.token, type))).toBeLessThanOrEqual(30);
  });

  it('gives every new owner exactly the same sample data', async () => {
    const first = await OwnerWithBusiness(BusinessTypeEnum.RETAIL);
    const second = await OwnerWithBusiness(BusinessTypeEnum.RETAIL);
    const a = await snapshot(first.api);
    expect(a.items.length).toBeGreaterThan(0);
    expect(a.orders.length).toBeGreaterThan(0);
    expect(await snapshot(second.api)).toEqual(a);
  });

  it('reloads the same sample data on reset', async () => {
    const owner = await OwnerWithBusiness(BusinessTypeEnum.CAFE);
    const before = await snapshot(owner.api);
    expect((await owner.api.post('/reset', { sampleData: true })).status).toBe(200);
    expect(await snapshot(owner.api)).toEqual(before);
  });

  it('keeps the stock ledger in step with what is on the shelf', async () => {
    const { api } = await OwnerWithBusiness(BusinessTypeEnum.RETAIL);
    const items: { sku: string; kind: string; onHand: number }[] = (await api.get('/items')).body;
    const stocked = items.find((i) => i.kind === 'STOCK' && i.onHand > 0)!;
    const detail = (await api.get(`/items/${stocked.sku}`)).body;
    // The newest history row ends on today's count.
    expect(detail.movements[0].balance).toBe(stocked.onHand);
  });
});
