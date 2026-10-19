import { useEffect, useRef, useState } from 'react';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import { Cn } from '@/frontend/lib/utils';
import { FormatSigned } from '@/frontend/utils/format';
import { HumanizeStockStatus } from '@/frontend/utils/humanize';
import { BIN_W } from '../lib/layout';
import { CartonStack } from './CartonStack';

type BinProps = {
  code: string;
  item: ItemResponseType | undefined;
  left: number;
  top: number;
  highlighted: boolean;
  onHover: (item: ItemResponseType | null, el: HTMLElement | null) => void;
  onSelect: (item: ItemResponseType) => void;
};

/** One storage bin. Stock changes (from any tab) float a +/− label over the cartons. */
export function Bin({ code, item, left, top, highlighted, onHover, onSelect }: BinProps) {
  const onHand = item?.onHand;
  const sku = item?.sku;
  const prev = useRef({ sku, onHand });
  const [flash, setFlash] = useState<{ delta: number; key: number } | null>(null);

  useEffect(() => {
    const before = prev.current;
    prev.current = { sku, onHand };
    // Only animate quantity changes of the same item (a relocation swaps the item instead).
    if (before.sku !== sku || before.onHand === undefined || onHand === undefined || before.onHand === onHand) return;
    setFlash({ delta: onHand - before.onHand, key: Date.now() });
    const t = window.setTimeout(() => setFlash(null), 2600);
    return () => window.clearTimeout(t);
  }, [sku, onHand]);

  const style = { left, top, width: BIN_W };
  if (!item) {
    return (
      <div className="bin bin-empty" style={style} aria-hidden>
        <span className="bin-plate">{code}</span>
      </div>
    );
  }

  const label = `${item.name}, ${item.sku}. ${item.onHand} on hand, ${item.available} available${
    item.reserved ? `, ${item.reserved} reserved` : ''
  }${item.incoming ? `, ${item.incoming} incoming` : ''}. ${HumanizeStockStatus(item.status)}. Bin ${code}.`;

  return (
    <button
      type="button"
      className={Cn('bin', `bin-${item.status.toLowerCase()}`, highlighted && 'bin-highlight')}
      style={style}
      aria-label={label}
      data-sku={item.sku}
      onMouseEnter={(e) => onHover(item, e.currentTarget)}
      onMouseLeave={() => onHover(null, null)}
      onFocus={(e) => onHover(item, e.currentTarget)}
      onBlur={() => onHover(null, null)}
      onClick={() => onSelect(item)}
    >
      {highlighted && <span className="spotlight" aria-hidden />}
      <CartonStack item={item} />
      {item.status === 'OUT' && <span className="bin-chip chip-out">OUT</span>}
      {item.status === 'LOW' && <span className="bin-chip chip-low">LOW</span>}
      {item.incoming > 0 && <span className="bin-chip chip-incoming">+{item.incoming}</span>}
      {flash && (
        <span key={flash.key} className={Cn('bin-flash', flash.delta > 0 ? 'flash-up' : 'flash-down')}>
          {FormatSigned(flash.delta)}
        </span>
      )}
      <span className="bin-plate">{code}</span>
    </button>
  );
}
