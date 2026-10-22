import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/db/client';
import { BusinessTypeEnum } from '@/backend/types/template';
import { OwnerWithBusiness, ResetDatabase, SetupDatabase } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(() => db.close());

const trades = () => OwnerWithBusiness(BusinessTypeEnum.TRADES);

describe('trades · jobs Quoted → Scheduled → In progress → Done', () => {
  it('cannot book a job until its kit’s materials arrive', async () => {
    const { api } = await trades();
    const blocked = await api.post('/orders/JOB-5104/advance', { to: 'SCHEDULED' });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.details.shortages[0]).toMatchObject({ sku: 'ELC-203', needed: 6, available: 0 });

    await api.post('/deliveries/PO-7001/receive');
    expect((await api.post('/orders/JOB-5104/advance', { to: 'SCHEDULED' })).body.status).toBe('SCHEDULED');
    expect((await api.get('/items/ELC-203')).body).toMatchObject({ onHand: 48, reserved: 6, available: 42 });
  });

  it('logs partial material use on site and releases the rest when done', async () => {
    const { api } = await trades();
    expect((await api.get('/items/PLB-101')).body).toMatchObject({ onHand: 180, reserved: 4 });
    expect((await api.post('/orders/JOB-5102/consume')).status).toBe(409); // scheduled, not started

    const used = await api.post('/orders/JOB-5103/consume', { sku: 'PLB-103', qty: 4 });
    expect(used.body.lines.find((l: { sku: string }) => l.sku === 'PLB-103').done).toBe(4);
    expect((await api.post('/orders/JOB-5103/consume', { sku: 'PLB-103', qty: 5 })).status).toBe(400);
    // Labour lines are logged without touching stock.
    await api.post('/orders/JOB-5103/consume', { sku: 'SRV-01', qty: 5 });

    const done = await api.post('/orders/JOB-5103/advance', { to: 'DONE' });
    expect(done.body).toMatchObject({ status: 'DONE', closed: true });
    expect((await api.get('/items/PLB-103')).body).toMatchObject({ onHand: 31, reserved: 0 });
    expect((await api.get('/items/PLB-101')).body).toMatchObject({ onHand: 180, reserved: 0 });
  });

  it('treats labour and fees as always-available services', async () => {
    const { api } = await trades();
    const labour = await api.get('/items/SRV-01');
    expect(labour.body).toMatchObject({ kind: 'SERVICE', status: 'IN_STOCK' });
    expect((await api.post('/items/SRV-01/adjustments', { mode: 'ADD', qty: 1, reason: 'FOUND' })).status).toBe(400);
    const status = await api.get('/items?status=OUT');
    expect(status.body.map((i: { sku: string }) => i.sku).sort()).toEqual(['ELC-203', 'KIT-03']);
  });
});
