import { StockStatusTypeEnum, type ItemResponseType } from '../types';

export type CategoryValueType = { category: string; available: number; reserved: number; incoming: number; total: number };

const OTHER = 'OTHER';
const MAX_COLUMNS = 8;

const sum = (rows: CategoryValueType[], category: string): CategoryValueType => ({
  category,
  available: rows.reduce((s, r) => s + r.available, 0),
  reserved: rows.reduce((s, r) => s + r.reserved, 0),
  incoming: rows.reduce((s, r) => s + r.incoming, 0),
  total: rows.reduce((s, r) => s + r.total, 0),
});

/**
 * What each category's stock is worth at cost, biggest first: free to sell, set aside for orders, and on its way.
 * Money rather than units, because a category can mix grams, litres and pieces. Past eight columns the rest fold into one.
 */
export const ValueByCategory = (items: ItemResponseType[]): CategoryValueType[] => {
  const codes = [...new Set(items.map((i) => i.category))];
  const rows = codes
    .map((category) => {
      const inCategory = items.filter((i) => i.category === category);
      const worth = (qty: (i: ItemResponseType) => number) => inCategory.reduce((s, i) => s + Math.max(0, qty(i)) * i.cost, 0);
      const [available, reserved, incoming] = [worth((i) => i.available), worth((i) => i.reserved), worth((i) => i.incoming)];
      return { category, available, reserved, incoming, total: available + reserved + incoming };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
  return rows.length <= MAX_COLUMNS ? rows : [...rows.slice(0, MAX_COLUMNS - 1), sum(rows.slice(MAX_COLUMNS - 1), OTHER)];
};

export const CategoryLabel = (category: string, name: (code: string) => string) => (category === OTHER ? 'Other' : name(category));

/** What it costs to bring everything low or out back up to its reorder level, after what is already on the way. */
export const RestockCost = (items: ItemResponseType[]): number =>
  items
    .filter((i) => i.status !== StockStatusTypeEnum.IN_STOCK)
    .reduce((s, i) => s + Math.max(0, i.reorderLevel - i.available - i.incoming) * i.cost, 0);
