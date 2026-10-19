import { SearchInput, SegmentedControl, Select } from '@/frontend/components/form';
import { AISLE_OPTIONS, CATEGORY_OPTIONS, STATUS_FILTERS } from '../lib/inventory-options';
import type { CategoryTypeEnum, ItemFilterStatusTypeEnum } from '../types';

export type InventoryFilterState = {
  search: string;
  category: CategoryTypeEnum | '';
  aisle: string;
  status: ItemFilterStatusTypeEnum | 'ALL';
};

type Props = {
  value: InventoryFilterState;
  onChange: (next: InventoryFilterState) => void;
  searching: boolean;
};

export function InventoryFilters({ value, onChange, searching }: Props) {
  const set = <K extends keyof InventoryFilterState>(key: K, v: InventoryFilterState[K]) => onChange({ ...value, [key]: v });
  return (
    <div className="filters">
      <SearchInput
        label="Search inventory by name or SKU"
        placeholder="Search name or SKU…"
        value={value.search}
        busy={searching}
        onChange={(v) => set('search', v)}
      />
      <Select
        aria-label="Filter by category"
        value={value.category}
        options={CATEGORY_OPTIONS}
        onChange={(v) => set('category', v as CategoryTypeEnum | '')}
      />
      <Select aria-label="Filter by aisle" value={value.aisle} options={AISLE_OPTIONS} onChange={(v) => set('aisle', v)} />
      <SegmentedControl
        label="Filter by stock status"
        size="sm"
        value={value.status}
        options={STATUS_FILTERS}
        onChange={(v) => set('status', v)}
      />
    </div>
  );
}
