import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { FormatQty } from '@/frontend/utils/format';
import { inventoryService } from '../services';
import type { ComponentInput, ItemDetailResponseType } from '../types';
import { RecipeEditor } from './RecipeEditor';

/** The components of a made item, editable by managers. */
export const RecipeSection = ({ item, canEdit, onOpen }: { item: ItemDetailResponseType; canEdit: boolean; onOpen: (sku: string) => void }) => {
  const [draft, setDraft] = useState<ComponentInput[] | null>(null);
  const save = inventoryService.useSetItemComponents();

  if (draft) {
    return (
      <>
        <RecipeEditor value={draft} onChange={setDraft} />
        <div className="form-actions">
          <Button size="sm" onClick={() => setDraft(null)}>Cancel</Button>
          <Button size="sm" variant="primary" loading={save.isPending} disabled={!draft.length} onClick={() => save.mutate({ sku: item.sku, components: draft }, { onSuccess: () => setDraft(null) })}>
            Save recipe
          </Button>
        </div>
      </>
    );
  }
  return (
    <>
      {item.components.length ? (
        <ul className="open-work">
          {item.components.map((c) => (
            <li key={c.sku}>
              <button type="button" className="link" onClick={() => onOpen(c.sku)}>{c.name}</button> × {FormatQty(c.qty, c.unit)}
              <span className="muted small"> · {FormatQty(c.available, c.unit)} available</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">No components yet — it can’t be made until it has some.</p>
      )}
      {canEdit && (
        <Button size="sm" icon="edit" onClick={() => setDraft(item.components.map((c) => ({ sku: c.sku, qty: c.qty })))}>
          Edit recipe
        </Button>
      )}
    </>
  );
};
