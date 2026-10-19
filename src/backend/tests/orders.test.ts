import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/db/client';
import { api, ResetData, SetupDatabase } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetData);
afterAll(() => db.close());

describe('order lifecycle', () => {
  it('allocates stock when picking starts, then consumes it as lines are picked', async () => {
    const before = await api.get('/api/items/HOM-3001');
    expect(before.body).toMatchObject({ onHand: 186, reserved: 0, available: 186 });

    const started = await api.post('/api/orders/SO-10232/start-picking');
    expect(started.status).toBe(200);
    expect(started.body.status).toBe('PICKING');

    const allocated = await api.get('/api/items/HOM-3001');
    expect(allocated.body).toMatchObject({ onHand: 186, reserved: 24, available: 162 });

    const picked = await api.post('/api/orders/SO-10232/lines/HOM-3001/pick');
    expect(picked.status).toBe(200);
    expect(picked.body.pickedUnits).toBe(24);

    const after = await api.get('/api/items/HOM-3001');
    expect(after.body).toMatchObject({ onHand: 162, reserved: 0, available: 162 });
    expect(after.body.movements[0]).toMatchObject({ type: 'PICK', delta: -24, ref: 'SO-10232' });
  });

  it('blocks release when available stock is short', async () => {
    await api.post('/api/items/HLT-6002/adjustments', { mode: 'SET', qty: 5, reason: 'CYCLE_COUNT' });
    const res = await api.post('/api/orders/SO-10238/start-picking');
    expect(res.status).toBe(409);
    expect(res.body.error.details.shortages[0]).toMatchObject({ sku: 'HLT-6002', needed: 12, available: 5 });
  });

  it('enforces New → Picking → Packed → Shipped', async () => {
    const early = await api.post('/api/orders/SO-10231/pack');
    expect(early.status).toBe(409); // lines still open

    expect((await api.post('/api/orders/SO-10231/pick-all')).body.pickedUnits).toBe(20);
    expect((await api.post('/api/orders/SO-10231/pack')).body.status).toBe('PACKED');
    expect((await api.post('/api/orders/SO-10231/pick-all')).status).toBe(409);
    expect((await api.post('/api/orders/SO-10231/ship')).body.status).toBe('SHIPPED');
    expect((await api.post('/api/orders/SO-10231/ship')).status).toBe(409);
  });

  it('reassigns pickers', async () => {
    const res = await api.patch('/api/orders/SO-10233', { assignee: 'u-marcus' });
    expect(res.body.assignee).toBe('u-marcus');
    const bad = await api.patch('/api/orders/SO-10233', { assignee: 'nobody' });
    expect(bad.status).toBe(400);
  });
});
