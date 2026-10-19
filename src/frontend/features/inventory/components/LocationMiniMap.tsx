import { AISLES, BINS, LEVELS, locationCode } from '@/frontend/features/warehouse/lib/layout';
import { Cn } from '@/frontend/lib/utils';

/** Compact elevation map of every bin; the item's bin is highlighted. */
export function LocationMiniMap({ highlight }: { highlight: string | null }) {
  return (
    <div className="minimap" role="img" aria-label={highlight ? `Bin ${highlight} highlighted on the warehouse map` : 'Warehouse map'}>
      {AISLES.map((a) => (
        <div key={a} className="minimap-aisle">
          <span className="minimap-label">{a}</span>
          <div className="minimap-grid">
            {[...LEVELS].reverse().map((l) =>
              BINS.map((b) => {
                const code = locationCode(a, l, b);
                return <span key={code} className={Cn('minimap-cell', code === highlight && 'minimap-cell-on')} />;
              }),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
