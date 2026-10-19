import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/db/client';
import { api, ResetData, SetupDatabase } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetData);
afterAll(() => db.close());

describe('deliveries', () => {
  it('receiving increases stock, clears incoming and logs the receipt', async () => {
    const unloading = await api.post('/api/deliveries/DLV-2041/start-unloading', {}, 'u-ana');
    expect(unloading.body.status).toBe('UNLOADING');

    const res = await api.post('/api/deliveries/DLV-2041/receive', { lines: [{ sku: 'ELC-1002', received: 55 }] }, 'u-ana');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('RECEIVED');
    expect(res.body.lines.find((l: { sku: string }) => l.sku === 'ELC-1002').received).toBe(55);

    const speaker = await api.get('/api/items/ELC-1004');
    expect(speaker.body).toMatchObject({ onHand: 120, incoming: 0, status: 'IN_STOCK' });
    const hub = await api.get('/api/items/ELC-1002');
    expect(hub.body.onHand).toBe(42 + 55);
    expect(hub.body.movements[0]).toMatchObject({ type: 'RECEIPT', delta: 55, ref: 'DLV-2041', userId: 'u-ana' });

    const activity = await api.get('/api/activity?kind=DELIVERY&limit=1');
    expect(activity.body[0].message).toContain('Received DLV-2041');
  });

  it('cannot receive twice or with foreign SKUs', async () => {
    expect((await api.post('/api/deliveries/DLV-2040/receive')).status).toBe(409);
    const foreign = await api.post('/api/deliveries/DLV-2042/receive', { lines: [{ sku: 'ELC-1001', received: 1 }] });
    expect(foreign.status).toBe(400);
  });

  it('books a new in-transit delivery for the items with the lowest cover', async () => {
    const res = await api.post('/api/deliveries');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'DLV-2045', status: 'IN_TRANSIT' });
    expect(res.body.lines.length).toBeGreaterThan(0);
    const upcoming = await api.get('/api/deliveries?view=UPCOMING');
    expect(upcoming.body.some((d: { id: string }) => d.id === 'DLV-2045')).toBe(true);
  });

  it('feeds the dashboard', async () => {
    const res = await api.get('/api/dashboard');
    expect(res.body.kpis).toMatchObject({ totalSkus: 33, outOfStock: 3, incomingDeliveries: 4, openOrders: 7 });
  });
});
