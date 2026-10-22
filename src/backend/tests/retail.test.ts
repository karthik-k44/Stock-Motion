import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/db/client';
import { BusinessTypeEnum } from '@/backend/types/template';
import { OwnerWithBusiness, ResetDatabase, SetupDatabase } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(() => db.close());

const retail = () => OwnerWithBusiness(BusinessTypeEnum.RETAIL);

describe('retail · stock', () => {
  it('derives reserved, available and incoming from orders and deliveries', async () => {
    const { api } = await retail();
    // SO-10231 is being picked and still needs 10 running caps
    expect((await api.get('/items/APP-4004')).body).toMatchObject({ onHand: 76, reserved: 10, available: 66, status: 'IN_STOCK' });
    expect((await api.get('/items/ELC-1004')).body).toMatchObject({ onHand: 0, incoming: 120, status: 'OUT' });
    // A bundle can be made as often as its scarcest component allows (10 mice available).
    expect((await api.get('/items/BND-0001')).body).toMatchObject({ kind: 'MADE', available: 10, status: 'IN_STOCK' });
  });

  it('filters by search, zone and status', async () => {
    const { api } = await retail();
    const out = await api.get('/items?status=OUT');
    expect(out.body.map((i: { sku: string }) => i.sku).sort()).toEqual(['APP-4007', 'ELC-1004', 'HOM-3005']);
    const aisleB = await api.get('/items?zone=B&search=mug');
    expect(aisleB.body.map((i: { sku: string }) => i.sku)).toEqual(['HOM-3002']);
  });

  it('adjusts stock, records the ledger and refuses to go below reserved', async () => {
    const { api } = await retail();
    const res = await api.post('/items/OFC-2001/adjustments', { mode: 'ADD', qty: 12, reason: 'FOUND', note: 'Behind returns cage' });
    expect(res.body.onHand).toBe(30);
    const detail = await api.get('/items/OFC-2001');
    expect(detail.body.movements[0]).toMatchObject({ type: 'ADJUSTMENT', delta: 12, balance: 30, actorName: 'Test Owner' });
    expect(detail.body.usedIn).toEqual([{ sku: 'BND-0001', name: 'Home Office Starter Bundle', qty: 1 }]);
    const activity = await api.get('/activity?kind=ADJUSTMENT&limit=1');
    expect(activity.body[0].message).toContain('Ergonomic Mouse by +12');

    const below = await api.post('/items/APP-4004/adjustments', { mode: 'REMOVE', qty: 70, reason: 'DAMAGED' });
    expect(below.status).toBe(409);
  });

  it('keeps one product per bin', async () => {
    const { api } = await retail();
    expect((await api.post('/items/ELC-1001/relocate', { location: 'A-1-2' })).status).toBe(409);
    expect((await api.post('/items/ELC-1001/relocate', { location: 'D-3-4' })).body.location).toBe('D-3-4');
    expect((await api.post('/items/ELC-1001/relocate', { location: 'Z-9-9' })).status).toBe(400);
  });

  it('creates, edits and archives catalogue items', async () => {
    const { api } = await retail();
    const created = await api.post('/items', {
      sku: 'ofc-2005', name: 'Desk Lamp', category: 'OFFICE', unit: 'ea', onHand: 15, reorderLevel: 5, cost: 12.5, price: 39, location: 'D-3-3',
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ sku: 'OFC-2005', onHand: 15, cost: 12.5, price: 39 });
    expect((await api.post('/items', { sku: 'OFC-2005', name: 'Dup', category: 'OFFICE', unit: 'ea' })).status).toBe(409);
    expect((await api.post('/items', { sku: 'X-1', name: 'Bad', category: 'NOPE', unit: 'ea' })).status).toBe(400);

    const edited = await api.put('/items/OFC-2005', { name: 'LED Desk Lamp', category: 'OFFICE', unit: 'ea', reorderLevel: 6, cost: 12.5, price: 42, supplierId: null });
    expect(edited.body).toMatchObject({ name: 'LED Desk Lamp', price: 42 });
    expect((await api.delete('/items/OFC-2005')).status).toBe(204);
    expect((await api.get('/items/OFC-2005')).status).toBe(404);
    // Still on an open order, so it can't be archived.
    expect((await api.delete('/items/HOM-3001')).status).toBe(409);
  });
});

describe('retail · order flow New → Picking → Packed → Shipped', () => {
  it('reserves on release, then takes stock as lines are picked', async () => {
    const { api } = await retail();
    expect((await api.get('/items/HOM-3001')).body).toMatchObject({ onHand: 186, reserved: 0, available: 186 });
    const released = await api.post('/orders/SO-10232/advance', { to: 'PICKING' });
    expect(released.body).toMatchObject({ status: 'PICKING', reserves: true });
    expect((await api.get('/items/HOM-3001')).body).toMatchObject({ onHand: 186, reserved: 24, available: 162 });

    const picked = await api.post('/orders/SO-10232/consume', { sku: 'HOM-3001' });
    expect(picked.body.doneUnits).toBe(24);
    const after = await api.get('/items/HOM-3001');
    expect(after.body).toMatchObject({ onHand: 162, reserved: 0, available: 162 });
    expect(after.body.movements[0]).toMatchObject({ type: 'CONSUME', delta: -24, ref: 'SO-10232' });
  });

  it('blocks release when available stock is short', async () => {
    const { api } = await retail();
    await api.post('/items/HLT-6002/adjustments', { mode: 'SET', qty: 5, reason: 'CYCLE_COUNT' });
    const res = await api.post('/orders/SO-10238/advance', { to: 'PICKING' });
    expect(res.status).toBe(409);
    expect(res.body.error.details.shortages[0]).toMatchObject({ sku: 'HLT-6002', needed: 12, available: 5 });
  });

  it('enforces the flow and refuses stale or skipped stages', async () => {
    const { api } = await retail();
    expect((await api.post('/orders/SO-10233/advance', { to: 'PACKED' })).status).toBe(409); // skips Picking
    expect((await api.post('/orders/SO-10231/advance', { to: 'PACKED' })).status).toBe(409); // lines still open
    expect((await api.post('/orders/SO-10231/consume')).body.doneUnits).toBe(20);
    expect((await api.post('/orders/SO-10231/advance', { to: 'PACKED' })).body.status).toBe('PACKED');
    expect((await api.post('/orders/SO-10231/consume')).status).toBe(409);
    expect((await api.post('/orders/SO-10231/advance', { to: 'SHIPPED' })).body).toMatchObject({ status: 'SHIPPED', closed: true });
    expect((await api.post('/orders/SO-10231/advance', { to: 'SHIPPED' })).status).toBe(409);
  });

  it('creates numbered orders, counts revenue when shipped, and cancels', async () => {
    const { api } = await retail();
    const customers = await api.get('/customers?search=lumen');
    const order = await api.post('/orders', {
      customerId: customers.body[0].id, lines: [{ sku: 'ELC-1005', qty: 10 }, { sku: 'BND-0001', qty: 1, unitPrice: 70 }],
    });
    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({ number: 'SO-10239', customerName: 'Lumen Studio', status: 'NEW', total: 160 });

    const before = (await api.get('/dashboard')).body.kpis.revenueToday;
    await api.post('/orders/SO-10239/advance', { to: 'PICKING' });
    // Picking a bundle takes its components.
    await api.post('/orders/SO-10239/consume');
    expect((await api.get('/items/OFC-2004')).body.onHand).toBe(26);
    await api.post('/orders/SO-10239/advance', { to: 'PACKED' });
    await api.post('/orders/SO-10239/advance', { to: 'SHIPPED' });
    expect((await api.get('/dashboard')).body.kpis.revenueToday).toBeCloseTo(before + 160, 2);

    await api.post('/orders/SO-10237/cancel');
    expect((await api.get('/items/OFC-2001')).body.reserved).toBe(0);
    expect((await api.get('/orders/SO-10237')).body).toMatchObject({ status: 'CANCELLED', cancelled: true });
  });
});

describe('retail · deliveries', () => {
  it('receiving increases stock, clears incoming and logs the receipt', async () => {
    const { api } = await retail();
    expect((await api.post('/deliveries/DLV-2041/status', { to: 'ARRIVED' })).body.status).toBe('ARRIVED');
    const res = await api.post('/deliveries/DLV-2041/receive', { lines: [{ sku: 'ELC-1002', received: 55 }] });
    expect(res.body.status).toBe('RECEIVED');
    expect((await api.get('/items/ELC-1004')).body).toMatchObject({ onHand: 120, incoming: 0, status: 'IN_STOCK' });
    const hub = await api.get('/items/ELC-1002');
    expect(hub.body.onHand).toBe(42 + 55);
    expect(hub.body.movements[0]).toMatchObject({ type: 'RECEIPT', delta: 55, ref: 'DLV-2041' });
  });

  it('cannot receive twice or with foreign SKUs', async () => {
    const { api } = await retail();
    expect((await api.post('/deliveries/DLV-2040/receive')).status).toBe(409);
    expect((await api.post('/deliveries/DLV-2042/receive', { lines: [{ sku: 'ELC-1001', received: 1 }] })).status).toBe(400);
  });

  it('reorders low stock from each item’s supplier', async () => {
    const { api } = await retail();
    const res = await api.post('/deliveries/reorder');
    expect(res.status).toBe(201);
    const skus = res.body.flatMap((d: { lines: { sku: string }[] }) => d.lines.map((l) => l.sku));
    expect(skus).toContain('OFC-2001'); // low, nothing incoming
    expect(skus).not.toContain('ELC-1004'); // 120 already on the way
    expect(res.body[0].number).toMatch(/^DLV-20\d\d$/);
  });

  it('feeds the dashboard', async () => {
    const { api } = await retail();
    const res = await api.get('/dashboard');
    expect(res.body.kpis).toMatchObject({ totalItems: 33, madeItems: 1, outOfStock: 3, incomingDeliveries: 4, openOrders: 7, customers: 8, team: 1 });
    expect(res.body.ordersByStatus).toEqual({ NEW: 4, PICKING: 2, PACKED: 1 });
    expect(res.body.zones.map((z: { zone: string }) => z.zone)).toEqual(['A', 'B', 'C', 'D']);
  });
});
