import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/db/client';
import { api, ResetData, SetupDatabase } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetData);
afterAll(() => db.close());

describe('items', () => {
  it('derives reserved, available and incoming from orders and deliveries', async () => {
    const res = await api.get('/api/items/APP-4004');
    expect(res.status).toBe(200);
    // SO-10231 is being picked and still needs 10 running caps
    expect(res.body).toMatchObject({ onHand: 76, reserved: 10, available: 66, status: 'IN_STOCK' });

    const speaker = await api.get('/api/items/ELC-1004');
    expect(speaker.body).toMatchObject({ onHand: 0, incoming: 120, status: 'OUT' });
  });

  it('filters by search, aisle and status', async () => {
    const out = await api.get('/api/items?status=OUT');
    expect(out.body.map((i: { sku: string }) => i.sku).sort()).toEqual(['APP-4007', 'ELC-1004', 'HOM-3005']);
    const aisleB = await api.get('/api/items?aisle=B&search=mug');
    expect(aisleB.body).toHaveLength(1);
    expect(aisleB.body[0].sku).toBe('HOM-3002');
  });

  it('adjusts stock and records a movement and an activity entry', async () => {
    const res = await api.post('/api/items/OFC-2001/adjustments', { mode: 'ADD', qty: 12, reason: 'FOUND', note: 'Behind returns cage' });
    expect(res.status).toBe(200);
    expect(res.body.onHand).toBe(30);

    const detail = await api.get('/api/items/OFC-2001');
    expect(detail.body.movements[0]).toMatchObject({ type: 'ADJUSTMENT', delta: 12, balance: 30, userId: 'u-jordan' });
    const activity = await api.get('/api/activity?kind=ADJUSTMENT&limit=1');
    expect(activity.body[0].message).toContain('Ergonomic Mouse by +12');
  });

  it('refuses to take on-hand below reserved stock', async () => {
    // APP-4004 has 10 reserved; removing 70 of 76 would leave 6
    const res = await api.post('/api/items/APP-4004/adjustments', { mode: 'REMOVE', qty: 70, reason: 'DAMAGED' });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/reserved/);
  });

  it('validates adjustments', async () => {
    const noNote = await api.post('/api/items/OFC-2001/adjustments', { mode: 'ADD', qty: 1, reason: 'OTHER' });
    expect(noNote.status).toBe(400);
    expect(noNote.body.error.code).toBe('VALIDATION_FAILED');

    const zero = await api.post('/api/items/OFC-2001/adjustments', { mode: 'REMOVE', qty: 0, reason: 'DAMAGED' });
    expect(zero.status).toBe(400);
  });

  it('requires an acting user for writes', async () => {
    const res = await api.post('/api/items/OFC-2001/adjustments', { mode: 'ADD', qty: 1, reason: 'FOUND' }, '');
    expect(res.status).toBe(401);
  });

  it('relocates only into empty bins', async () => {
    const taken = await api.post('/api/items/OFC-2004/relocate', { location: 'A-1-1' });
    expect(taken.status).toBe(409);
    const moved = await api.post('/api/items/OFC-2004/relocate', { location: 'A-3-4' });
    expect(moved.status).toBe(200);
    expect(moved.body.location).toBe('A-3-4');
    const locations = await api.get('/api/locations');
    expect(locations.body.find((l: { code: string }) => l.code === 'A-3-3').item).toBeNull();
  });
});
