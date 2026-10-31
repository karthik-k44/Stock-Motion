import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CloseDb } from '@/backend/db/client';
import { BusinessTypeEnum } from '@/backend/types/template';
import { OwnerWithBusiness, ResetDatabase, SetupDatabase } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(CloseDb);

const cafe = () => OwnerWithBusiness(BusinessTypeEnum.CAFE);

describe('café · recipes', () => {
  it('works out how many of each menu item can be made', async () => {
    const { api } = await cafe();
    // Two tickets are being prepared: 72 g of beans and 540 ml of milk are already reserved.
    expect((await api.get('/items/CAF-001')).body).toMatchObject({ onHand: 9500, reserved: 72, available: 9428 });
    // Flat white = 18 g beans + 180 ml milk → limited by milk: 27460 / 180.
    const flatWhite = await api.get('/items/MNU-001');
    expect(flatWhite.body).toMatchObject({ kind: 'MADE', available: 152, status: 'IN_STOCK' });
    expect(flatWhite.body.components.map((c: { sku: string; qty: number }) => [c.sku, c.qty])).toEqual([['CAF-001', 18], ['DAI-001', 180]]);
    // Garden salad is limited by 800 g of greens: 6 left, at its reorder point.
    expect((await api.get('/items/MNU-009')).body).toMatchObject({ available: 6, status: 'LOW' });
  });

  it('edits a recipe', async () => {
    const { api } = await cafe();
    const res = await api.put('/items/MNU-001/components', { components: [{ sku: 'CAF-001', qty: 20 }, { sku: 'DAI-002', qty: 180 }] });
    expect(res.body.available).toBe(Math.floor((6000 - 220) / 180));
    expect((await api.put('/items/MNU-001/components', { components: [{ sku: 'MNU-002', qty: 1 }] })).status).toBe(400);
    expect((await api.put('/items/CAF-001/components', { components: [{ sku: 'DAI-001', qty: 1 }] })).status).toBe(400);
  });
});

describe('café · tickets New → Preparing → Served', () => {
  it('reserves ingredients while preparing and uses them when served', async () => {
    const { api } = await cafe();
    expect((await api.post('/orders/TKT-1041/advance', { to: 'PREPARING' })).body.status).toBe('PREPARING');
    expect((await api.get('/items/BAK-002')).body).toMatchObject({ onHand: 42, reserved: 2 });

    // Preparing doesn't take line by line; serving takes everything.
    expect((await api.post('/orders/TKT-1041/consume')).status).toBe(409);
    const served = await api.post('/orders/TKT-1041/advance', { to: 'SERVED' });
    expect(served.body).toMatchObject({ status: 'SERVED', closed: true, total: 2 * 4.8 + 13.5 });
    expect((await api.get('/items/CAF-001')).body).toMatchObject({ onHand: 9500 - 36 });
    expect((await api.get('/items/DAI-001')).body).toMatchObject({ onHand: 28000 - 360 });
    const bread = await api.get('/items/BAK-002');
    expect(bread.body).toMatchObject({ onHand: 40, reserved: 0 });
    expect(bread.body.movements[0]).toMatchObject({ type: 'CONSUME', delta: -2, ref: 'TKT-1041' });
  });

  it('sells stocked drinks directly and refuses a ticket the kitchen cannot make', async () => {
    const { api } = await cafe();
    const ticket = await api.post('/orders', { customerName: 'Table 6', lines: [{ sku: 'DRK-001', qty: 2 }, { sku: 'MNU-009', qty: 7 }] });
    expect(ticket.body.number).toBe('TKT-1045');
    const short = await api.post('/orders/TKT-1045/advance', { to: 'PREPARING' });
    expect(short.status).toBe(409);
    expect(short.body.error.details.shortages).toEqual([expect.objectContaining({ sku: 'PRO-003', needed: 840, available: 800 })]);

    await api.put('/orders/TKT-1045/lines', { lines: [{ sku: 'DRK-001', qty: 2 }, { sku: 'MNU-009', qty: 6 }] });
    await api.post('/orders/TKT-1045/advance', { to: 'PREPARING' });
    await api.post('/orders/TKT-1045/advance', { to: 'SERVED' });
    expect((await api.get('/items/DRK-001')).body.onHand).toBe(46);
    expect((await api.get('/items/PRO-003')).body).toMatchObject({ onHand: 80, status: 'LOW' });
  });

  it('cancelling releases the reservation', async () => {
    const { api } = await cafe();
    await api.post('/orders/TKT-1043/cancel');
    expect((await api.get('/items/CAF-001')).body.reserved).toBe(18);
    expect((await api.get('/items/PKG-001')).body.reserved).toBe(0);
  });

  it('shows the counter on the dashboard', async () => {
    const { api } = await cafe();
    const res = await api.get('/dashboard');
    expect(res.body.ordersByStatus).toEqual({ NEW: 2, PREPARING: 2 });
    expect(res.body.kpis).toMatchObject({ madeItems: 9, totalItems: 20, outOfStock: 1, incomingDeliveries: 3 });
    expect(res.body.zones.map((z: { name: string }) => z.name)).toEqual(['Dry store', 'Walk-in fridge', 'Freezer', 'Coffee bar', 'Front counter']);
  });
});
