import type { CSSProperties } from 'react';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import { Cn } from '@/frontend/lib/utils';
import { CATEGORY_COLOR } from '@/frontend/utils/category';
import { CartonCount, CartonJitter } from '../lib/scene-math';

const W = 30;
const H = 33;

/** Cardboard cartons for one bin. Count tracks stock cover; violet straps mark reserved cartons. */
export function CartonStack({ item }: { item: ItemResponseType }) {
  const count = CartonCount(item.onHand, item.reorderLevel);
  const reservedCartons = item.reserved > 0 ? Math.max(1, Math.round((count * item.reserved) / Math.max(1, item.onHand))) : 0;
  const ghost = item.incoming > 0 && count < 6;

  return (
    <span className="cartons">
      {Array.from({ length: count }, (_, i) => {
        const { dx, rot } = CartonJitter(item.sku, i);
        const style = {
          left: (i % 3) * (W + 3) + dx,
          bottom: Math.floor(i / 3) * (H + 1),
          transform: `rotate(${rot}deg)`,
          '--i': i,
          '--label': CATEGORY_COLOR[item.category],
        } as CSSProperties;
        return <span key={i} className={Cn('carton', i >= count - reservedCartons && 'carton-reserved')} style={style} />;
      })}
      {ghost && (
        <span
          className="carton carton-ghost"
          style={{ left: (count % 3) * (W + 3), bottom: Math.floor(count / 3) * (H + 1) }}
        />
      )}
    </span>
  );
}
