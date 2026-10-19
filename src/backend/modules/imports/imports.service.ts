import { BadRequest } from '@/backend/common/errors';
import { RecordActivity, RecordMovement } from '@/backend/common/services/audit';
import { ParseCsv } from '@/backend/common/utils/csv';
import { db, type Queryable } from '@/backend/db/client';
import type { ItemViewRow } from '@/backend/db/schema';
import { categoriesRepository } from '@/backend/modules/categories/categories.repository';
import { itemsRepository } from '@/backend/modules/items/items.repository';
import { locationsRepository } from '@/backend/modules/locations/locations.repository';
import { suppliersRepository } from '@/backend/modules/suppliers/suppliers.repository';
import { BroadcastChange } from '@/backend/realtime/socket';
import { ActivityKindTypeEnum } from '@/backend/types/activity';
import type { ScopeType } from '@/backend/types/business';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import type { ImportPreviewResponseType, ImportResultResponseType } from '@/backend/types/import';
import { ItemKindTypeEnum, MovementTypeEnum } from '@/backend/types/item';
import { IMPORT_HEADERS, ImportRowSchema, type ImportItemsInput, type ImportRowInput } from './imports.validators';

const MAX_ROWS = 2000;

type AnalysedRowType = { line: number; data: ImportRowInput | null; existing: ItemViewRow | undefined; errors: string[] };

const categoryCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

/** Parse and check every row against the business without writing anything. */
async function analyse(q: Queryable, scope: ScopeType, csv: string) {
  const table = ParseCsv(csv);
  if (table.length < 2) throw BadRequest('The file needs a header row and at least one item');
  if (table.length - 1 > MAX_ROWS) throw BadRequest(`Import up to ${MAX_ROWS} items at a time`);
  const header = table[0].map((h) => IMPORT_HEADERS[h.trim().toLowerCase().replace(/[\s-]+/g, '_')]);
  for (const required of ['sku', 'name', 'category'] as const) {
    if (!header.includes(required)) throw BadRequest(`The header row needs a "${required}" column`);
  }

  const [items, categories, locations, suppliers] = await Promise.all([
    itemsRepository.ListViews(q, scope.businessId),
    categoriesRepository.List(q, scope.businessId),
    locationsRepository.List(q, scope.businessId),
    suppliersRepository.List(q, scope.businessId),
  ]);
  const categoryOf = (value: string) =>
    categories.find((c) => c.code === value.toUpperCase() || c.name.toLowerCase() === value.toLowerCase());
  const supplierOf = (value: string) => suppliers.find((s) => s.name.toLowerCase() === value.toLowerCase());
  const seenSkus = new Set<string>();
  const claimedLocations = new Map<string, string>();
  const newCategories = new Set<string>();
  const newSuppliers = new Set<string>();

  const parsedRows = table.slice(1).map((cells) => {
    const raw: Record<string, string> = {};
    header.forEach((field, col) => field && (raw[field] = cells[col] ?? ''));
    return ImportRowSchema.safeParse(raw);
  });
  // Where every item ends up once the file is applied, so bins can be swapped within one file.
  const finalLocation = new Map(items.map((it) => [it.sku, it.location]));
  for (const p of parsedRows) if (p.success && p.data.location) finalLocation.set(p.data.sku, p.data.location);

  const rows: AnalysedRowType[] = parsedRows.map((parsed, i) => {
    const line = i + 2;
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => `${e.path.join('.') || 'row'}: ${e.message}`);
      return { line, data: null, existing: undefined, errors };
    }
    const data = parsed.data;
    const errors: string[] = [];
    const existing = items.find((it) => it.sku === data.sku);
    if (seenSkus.has(data.sku)) errors.push(`${data.sku} appears more than once in the file`);
    seenSkus.add(data.sku);
    const kind = data.kind ?? (existing?.kind as ItemKindTypeEnum | undefined) ?? ItemKindTypeEnum.STOCK;
    if (existing && data.kind && data.kind !== existing.kind) errors.push(`kind can't change from ${existing.kind} to ${data.kind}`);
    if (kind !== ItemKindTypeEnum.STOCK && (data.onHand || data.location)) errors.push('only stock items have on-hand stock or a location');
    if (!existing && !data.unit) errors.push('unit is required for new items');
    if (!categoryOf(data.category)) newCategories.add(data.category);
    if (data.supplier && !supplierOf(data.supplier)) newSuppliers.add(data.supplier);
    if (data.location) {
      if (!locations.some((l) => l.code === data.location)) errors.push(`unknown location ${data.location}`);
      else if (scope.template.exclusiveLocations) {
        const occupant = items.find((it) => it.sku !== data.sku && finalLocation.get(it.sku) === data.location);
        const claimed = claimedLocations.get(data.location);
        if (occupant) errors.push(`${data.location} is occupied by ${occupant.sku}`);
        if (claimed && claimed !== data.sku) errors.push(`${data.location} is also given to ${claimed} in this file`);
        claimedLocations.set(data.location, data.sku);
      }
    }
    return { line, data, existing, errors };
  });

  const preview: ImportPreviewResponseType = {
    rows: rows.map((r) => ({
      line: r.line,
      sku: r.data?.sku ?? '',
      name: r.data?.name ?? '',
      action: r.existing ? 'UPDATE' : 'CREATE',
      errors: r.errors,
    })),
    creates: rows.filter((r) => !r.existing && !r.errors.length).length,
    updates: rows.filter((r) => r.existing && !r.errors.length).length,
    errorCount: rows.filter((r) => r.errors.length).length,
    newCategories: [...newCategories],
    newSuppliers: [...newSuppliers],
  };
  return { rows, preview };
}

async function Preview(scope: ScopeType, input: ImportItemsInput): Promise<ImportPreviewResponseType> {
  return (await analyse(db, scope, input.csv)).preview;
}

/** All or nothing: any row with an error rejects the whole file. */
async function Commit(scope: ScopeType, input: ImportItemsInput): Promise<ImportResultResponseType> {
  const { result, activity } = await db.transaction(async (tx) => {
    const { rows, preview } = await analyse(tx, scope, input.csv);
    if (preview.errorCount) throw BadRequest(`${preview.errorCount} row${preview.errorCount === 1 ? ' has' : 's have'} errors — fix them and try again`, preview);

    for (const name of preview.newCategories) {
      await categoriesRepository.Insert(tx, scope.businessId, { code: categoryCode(name) || 'OTHER', name });
    }
    for (const name of preview.newSuppliers) {
      await suppliersRepository.Insert(tx, scope.businessId, { name, contact: '', email: '', phone: '', leadDays: 2 });
    }
    const categories = await categoriesRepository.List(tx, scope.businessId);
    const suppliers = await suppliersRepository.List(tx, scope.businessId);
    const categoryCodeOf = (value: string) =>
      categories.find((c) => c.code === value.toUpperCase() || c.name.toLowerCase() === value.toLowerCase())!.code;
    const supplierIdOf = (value?: string) => (value ? suppliers.find((s) => s.name.toLowerCase() === value.toLowerCase())!.id : null);

    // Free bins first, so items can swap locations within one file.
    for (const r of rows) if (r.existing && r.data?.location && r.existing.location !== r.data.location) {
      await itemsRepository.SetLocation(tx, r.existing.id, null);
    }

    for (const r of rows) {
      const d = r.data!;
      const fields = {
        name: d.name,
        category: categoryCodeOf(d.category),
        unit: d.unit ?? r.existing?.unit ?? 'ea',
        reorderLevel: d.reorderLevel ?? r.existing?.reorder_level ?? 0,
        cost: d.cost ?? Number(r.existing?.cost ?? 0),
        price: d.price ?? Number(r.existing?.price ?? 0),
        supplierId: d.supplier ? supplierIdOf(d.supplier) : (r.existing?.supplier_id ?? null),
      };
      if (!r.existing) {
        const onHand = d.onHand ?? 0;
        const id = await itemsRepository.Insert(tx, scope.businessId, {
          ...fields, sku: d.sku, kind: d.kind ?? ItemKindTypeEnum.STOCK, onHand, location: d.location ?? null,
        });
        if (onHand > 0) {
          await RecordMovement(tx, scope, { itemId: id, type: MovementTypeEnum.ADJUSTMENT, delta: onHand, balance: onHand, note: 'Opening stock (import)' });
        }
        continue;
      }
      await itemsRepository.Update(tx, r.existing.id, fields);
      if (d.location && d.location !== r.existing.location) await itemsRepository.SetLocation(tx, r.existing.id, d.location);
      if (d.onHand !== undefined && d.onHand !== r.existing.on_hand) {
        if (d.onHand < r.existing.reserved) {
          throw BadRequest(`Line ${r.line}: ${d.sku} has ${r.existing.reserved} reserved — on hand can't be set to ${d.onHand}`);
        }
        await itemsRepository.SetOnHand(tx, r.existing.id, d.onHand);
        await RecordMovement(tx, scope, {
          itemId: r.existing.id, type: MovementTypeEnum.ADJUSTMENT, delta: d.onHand - r.existing.on_hand, balance: d.onHand,
          note: 'Stock count (import)',
        });
      }
    }
    const activity = await RecordActivity(tx, scope, {
      kind: ActivityKindTypeEnum.CATALOG,
      message: `Imported ${rows.length} ${scope.template.labels.items.toLowerCase()} from CSV (${preview.creates} new, ${preview.updates} updated)`,
      meta: { skus: rows.map((r) => r.data!.sku).slice(0, 50) },
    });
    return { result: { created: preview.creates, updated: preview.updates }, activity };
  });
  BroadcastChange(
    scope.businessId,
    [ResourceTypeEnum.ITEMS, ResourceTypeEnum.LOCATIONS, ResourceTypeEnum.DASHBOARD, ResourceTypeEnum.ACTIVITY, ResourceTypeEnum.CATEGORIES, ResourceTypeEnum.SUPPLIERS],
    [activity],
  );
  return result;
}

export const importsService = { Preview, Commit };
