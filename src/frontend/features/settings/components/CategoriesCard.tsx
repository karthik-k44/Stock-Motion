import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { categoriesService } from '@/frontend/features/inventory/services';
import { CategoryColor } from '@/frontend/utils/category';

export const CategoriesCard = () => {
  const { data: categories = [] } = categoriesService.useGetCategories();
  const create = categoriesService.useCreateCategory();
  const remove = categoriesService.useDeleteCategory();
  const [name, setName] = useState('');

  return (
    <Card title="Categories" subtitle="Used to group and colour items. A category can be removed once nothing uses it.">
      <ul className="chip-list">
        {categories.map((c) => (
          <li key={c.code} className="chip">
            <span className="cat-swatch" style={{ background: CategoryColor(categories, c.code) }} aria-hidden />
            {c.name} <span className="muted small">{c.itemCount}</span>
            {c.itemCount === 0 && !c.code.startsWith('pending') && (
              <button type="button" className="chip-x" aria-label={`Remove ${c.name}`} onClick={() => remove.mutate(c.code)}>×</button>
            )}
          </li>
        ))}
      </ul>
      <form className="invite-row" onSubmit={(e) => (e.preventDefault(), name.trim() && create.mutate(name.trim(), { onSuccess: () => setName('') }))}>
        <input className="input" aria-label="New category name" placeholder="New category…" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" icon="plus" disabled={!name.trim()}>Add</Button>
      </form>
    </Card>
  );
};
