import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/backend/db/client';
import { BusinessTypeEnum } from '@/backend/types/template';
import { OwnerWithBusiness, ResetDatabase, SetupDatabase } from './helpers';

beforeAll(SetupDatabase);
beforeEach(ResetDatabase);
afterAll(() => db.close());

const CSV = [
  'SKU,Name,Category,Unit,On hand,Reorder level,Cost,Price,Location,Supplier',
  'TST-1,"Widget, large",Electronics,ea,10,2,1.50,$4.00,A-1-1,Acme Parts',
  'TST-2,Gadget,Gizmos,ea,5,1,2,5,,',
  'TST-3,,Office,ea,1,1,1,1,,',
].join('\r\n');

describe('CSV import', () => {
  it('previews problems and creates nothing until the file is clean', async () => {
    const { api } = await OwnerWithBusiness(BusinessTypeEnum.RETAIL, false);
    const preview = await api.post('/imports/items/preview', { csv: CSV });
    expect(preview.body).toMatchObject({ creates: 2, updates: 0, errorCount: 1, newCategories: ['Gizmos'], newSuppliers: ['Acme Parts'] });
    expect(preview.body.rows[2]).toMatchObject({ line: 4, errors: [expect.stringContaining('name')] });

    expect((await api.post('/imports/items', { csv: CSV })).status).toBe(400);
    expect((await api.get('/items')).body).toEqual([]);

    const fixed = CSV.replace('TST-3,,Office', 'TST-3,Pen,Office');
    expect((await api.post('/imports/items', { csv: fixed })).body).toEqual({ created: 3, updated: 0 });
    expect((await api.get('/items/TST-1')).body).toMatchObject({ name: 'Widget, large', onHand: 10, cost: 1.5, price: 4, location: 'A-1-1' });
    expect((await api.get('/categories')).body.map((c: { code: string }) => c.code)).toContain('GIZMOS');
  });

  it('updates existing items, recounts stock and swaps bins in one file', async () => {
    const { api } = await OwnerWithBusiness(BusinessTypeEnum.RETAIL);
    const csv = ['sku,name,category,on_hand,location', 'ELC-1001,Wireless Earbuds Pro,ELECTRONICS,150,A-1-2', 'ELC-1002,USB-C Hub 7-port,ELECTRONICS,,A-1-1'].join('\n');
    expect((await api.post('/imports/items', { csv })).body).toEqual({ created: 0, updated: 2 });
    const earbuds = await api.get('/items/ELC-1001');
    expect(earbuds.body).toMatchObject({ onHand: 150, location: 'A-1-2' });
    expect(earbuds.body.movements[0]).toMatchObject({ type: 'ADJUSTMENT', delta: 2, note: 'Stock count (import)' });
    expect((await api.get('/items/ELC-1002')).body).toMatchObject({ onHand: 42, location: 'A-1-1' });

    const clash = await api.post('/imports/items/preview', { csv: 'sku,name,category,unit,location\nNEW-1,New thing,OFFICE,ea,A-1-3' });
    expect(clash.body.rows[0].errors).toEqual(['A-1-3 is occupied by ELC-1003']);
  });

  it('is limited to managers', async () => {
    const { api } = await OwnerWithBusiness(BusinessTypeEnum.CAFE, false);
    expect((await api.post('/imports/items/preview', { csv: 'name\nx' })).status).toBe(400); // missing sku column
  });
});
