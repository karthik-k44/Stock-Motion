import type { WorldContextType, WorldInspectorType, WorldLayoutType, WorldSelectionType } from '../types';
import { InspectObject } from './inspect';
import { InspectDelivery, InspectItem, InspectOrder } from './inspect-records';
import { FindDelivery, FindItem, FindOrder } from './selection';

/** What the inspector shows for a selection; null when nothing (or something that no longer exists) is selected. */
export const InspectorFor = (layout: WorldLayoutType, ctx: WorldContextType, selection: WorldSelectionType | null): WorldInspectorType | null => {
  if (!selection) return null;
  switch (selection.kind) {
    case 'object': {
      const spec = layout.objects.find((o) => o.id === selection.id);
      return spec ? InspectObject(spec, ctx) : null;
    }
    case 'delivery': {
      const d = FindDelivery(ctx, selection.number);
      return d ? InspectDelivery(d, ctx) : null;
    }
    case 'order': {
      const o = FindOrder(ctx, selection.number);
      return o ? InspectOrder(o, ctx) : null;
    }
    case 'item': {
      const i = FindItem(ctx, selection.sku);
      return i ? InspectItem(i, ctx) : null;
    }
  }
};
