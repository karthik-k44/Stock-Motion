import type { ItemResponseType } from '@/frontend/features/inventory/types';
import { Cn } from '@/frontend/lib/utils';
import { aisleX, BINS, binX, deckY, LEVELS, locationCode, RACK_W, type AisleId } from '../lib/layout';
import { Bin } from './Bin';

const RACK_TOP = 190;
const BIN_H = 118;

type RackProps = {
  aisle: AisleId;
  byLocation: Map<string, ItemResponseType>;
  revealed: boolean;
  highlightSku: string | null;
  onHover: (item: ItemResponseType | null, el: HTMLElement | null) => void;
  onSelect: (item: ItemResponseType) => void;
};

/** Pallet racking for one aisle: 3 shelf levels × 4 bins. Top level first so tab order reads like the rack. */
export function Rack({ aisle, byLocation, revealed, highlightSku, onHover, onSelect }: RackProps) {
  const x0 = aisleX(aisle);
  return (
    <div
      className={Cn('rack', revealed && 'rack-revealed')}
      style={{ left: x0, top: RACK_TOP, width: RACK_W, height: deckY(1) + 10 - RACK_TOP }}
      role="group"
      aria-label={`Aisle ${aisle} shelving`}
    >
      <span className="rack-post rack-post-l" aria-hidden />
      <span className="rack-post rack-post-r" aria-hidden />
      {LEVELS.map((l) => (
        <span key={l} className="rack-beam" style={{ top: deckY(l) - RACK_TOP }} aria-hidden />
      ))}
      <span className="rack-beam rack-beam-top" style={{ top: 0 }} aria-hidden />
      {[...LEVELS].reverse().map((l) =>
        BINS.map((b) => {
          const code = locationCode(aisle, l, b);
          const item = byLocation.get(code);
          return (
            <Bin
              key={code}
              code={code}
              item={item}
              left={binX(aisle, b) - x0}
              top={deckY(l) - RACK_TOP - BIN_H}
              highlighted={Boolean(item && item.sku === highlightSku)}
              onHover={onHover}
              onSelect={onSelect}
            />
          );
        }),
      )}
    </div>
  );
}
