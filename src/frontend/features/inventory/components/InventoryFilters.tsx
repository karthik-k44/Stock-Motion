import { SearchInput, SegmentedControl, Select } from '@/frontend/components/form';
import { businessesService } from '@/frontend/features/businesses/services';
import { STATUS_FILTERS } from '../lib/inventory-options';
import { categoriesService } from '../services';
import { ItemKindTypeEnum, type ItemFilterStatusTypeEnum } from '../types';

export type InventoryFilterState = {
  search: string;
  category: string;
  zone: string;
  status: ItemFilterStatusTypeEnum | 'ALL';
};

type Props = {
  kind: ItemKindTypeEnum;
  value: InventoryFilterState;
  onChange: (next: InventoryFilterState) => void;
  searching: boolean;
};

export function InventoryFilters({ kind, value, onChange, searching }: Props) {
  const { template } = businessesService.useBusiness();
  const { data: categories = [] } = categoriesService.useCategories();
  const set = <K extends keyof InventoryFilterState>(key: K, v: InventoryFilterState[K]) => onChange({ ...value, [key]: v });
  const stocked = kind === ItemKindTypeEnum.STOCK;
  return (
    <div className="filters">
      <SearchInput label="Search by name or SKU" placeholder="Search name or SKU…" value={value.search} busy={searching} onChange={(v) => set('search', v)} />
      <Select
        aria-label="Filter by category"
        value={value.category}
        options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c.code, label: c.name }))]}
        onChange={(v) => set('category', v)}
      />
      {stocked && (
        <Select
          aria-label={`Filter by ${template.labels.locations.toLowerCase()}`}
          value={value.zone}
          options={[{ value: '', label: `All ${template.labels.locations.toLowerCase()}` }, ...template.zones.map((z) => ({ value: z.code, label: z.name }))]}
          onChange={(v) => set('zone', v)}
        />
      )}
      {kind !== ItemKindTypeEnum.SERVICE && (
        <SegmentedControl
          label="Filter by stock status"
          size="sm"
          value={value.status}
          options={stocked ? STATUS_FILTERS : STATUS_FILTERS.slice(0, 4)}
          onChange={(v) => set('status', v)}
        />
      )}
    </div>
  );
}
