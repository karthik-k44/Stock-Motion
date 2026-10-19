import { z } from 'zod';
import { CostSchema, PriceSchema, QuantitySchema, SkuSchema } from '@/backend/modules/items/items.validators';
import { ItemKindTypeEnum } from '@/backend/types/item';

export const ImportItemsSchema = z.object({
  /** The CSV file's text. First row is the header. */
  csv: z.string().min(1, 'The file is empty').max(1_000_000, 'Keep the file under 1 MB'),
});
export type ImportItemsInput = z.infer<typeof ImportItemsSchema>;

const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const number = (schema: z.ZodNumber | z.ZodEffects<z.ZodNumber>) =>
  z.preprocess((v) => {
    const raw = blankToUndefined(v);
    return raw === undefined ? undefined : Number(String(raw).replace(/[$,\s]/g, ''));
  }, schema.optional());

/** One CSV row after header mapping. Blank optional cells fall back to defaults or the current value. */
export const ImportRowSchema = z.object({
  sku: SkuSchema,
  name: z.string().trim().min(1, 'name is required').max(120),
  category: z.string().trim().min(1, 'category is required').max(40),
  unit: z.preprocess(blankToUndefined, z.string().trim().max(12).optional()),
  kind: z.preprocess(
    (v) => (typeof v === 'string' ? blankToUndefined(v.trim().toUpperCase()) : v),
    z.nativeEnum(ItemKindTypeEnum).optional(),
  ),
  onHand: number(QuantitySchema),
  reorderLevel: number(QuantitySchema),
  cost: number(CostSchema),
  price: number(PriceSchema),
  location: z.preprocess(blankToUndefined, z.string().trim().toUpperCase().max(24).optional()),
  supplier: z.preprocess(blankToUndefined, z.string().trim().max(80).optional()),
});
export type ImportRowInput = z.infer<typeof ImportRowSchema>;

/** Accepted header spellings → field. */
export const IMPORT_HEADERS: Record<string, keyof ImportRowInput> = {
  sku: 'sku', code: 'sku',
  name: 'name', item: 'name', product: 'name',
  category: 'category',
  unit: 'unit', uom: 'unit',
  kind: 'kind', type: 'kind',
  on_hand: 'onHand', onhand: 'onHand', stock: 'onHand', qty: 'onHand', quantity: 'onHand',
  reorder_level: 'reorderLevel', reorder: 'reorderLevel', min: 'reorderLevel',
  cost: 'cost', unit_cost: 'cost',
  price: 'price', sell_price: 'price',
  location: 'location', bin: 'location', shelf: 'location',
  supplier: 'supplier', vendor: 'supplier',
};
