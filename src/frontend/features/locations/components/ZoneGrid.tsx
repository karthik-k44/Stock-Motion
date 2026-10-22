import { useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { paths } from '@/frontend/config/paths';
import type { StorageZoneType } from '@/frontend/features/businesses/types';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import type { LocationResponseType } from '../types';
import { LocationCell } from './LocationCell';

type Props = { zone: StorageZoneType; locations: LocationResponseType[]; issuesOnly: boolean };

/** A zone as it looks from the front: top level first, bins left to right. Extra locations follow. */
export const ZoneGrid = ({ zone, locations, issuesOnly }: Props) => {
  const navigate = useNavigate();
  const drawer = useItemDrawer();
  const filled = locations.filter((l) => l.items.length).length;
  const items = locations.reduce((s, l) => s + l.items.length, 0);
  const rows = Array.from({ length: zone.levels }, (_, i) => zone.levels - i);
  const codeOf = (level: number, bin: number) =>
    zone.bins > 1 ? `${zone.code}-${level}-${bin}` : zone.levels > 1 ? `${zone.code}-${level}` : zone.code;
  const placed = new Set(rows.flatMap((level) => Array.from({ length: zone.bins }, (_, b) => codeOf(level, b + 1))));
  const extra = locations.filter((l) => !placed.has(l.code));
  const dim = (l: LocationResponseType) => issuesOnly && !l.items.some((i) => i.status !== 'IN_STOCK');
  const first = locations.find((l) => l.items.length)?.items[0];

  return (
    <section className="card aisle" aria-labelledby={`zone-${zone.code}`}>
      <header className="card-head">
        <div>
          <h2 id={`zone-${zone.code}`} className="card-title">{zone.name}</h2>
          <p className="card-subtitle">{filled} of {locations.length} used · {items} item{items === 1 ? '' : 's'}</p>
        </div>
        {first && <Button size="sm" icon="locate" onClick={() => navigate(paths.locateItem(first.sku))}>View in world</Button>}
      </header>
      <div className="aisle-grid" role="grid" aria-label={`${zone.name} layout`}>
        {rows.map((level) => (
          <div key={level} role="row" className="aisle-row" style={{ '--bins': zone.bins } as React.CSSProperties}>
            <span className="aisle-level" role="rowheader">{zone.levelLabel} {level}</span>
            {Array.from({ length: zone.bins }, (_, b) => {
              const location = locations.find((l) => l.code === codeOf(level, b + 1));
              return location ? <LocationCell key={location.code} location={location} dimmed={dim(location)} onOpen={drawer.open} /> : <span key={b} role="gridcell" />;
            })}
          </div>
        ))}
        {extra.length > 0 && (
          <div role="row" className="aisle-row" style={{ '--bins': Math.min(extra.length, 4) } as React.CSSProperties}>
            <span className="aisle-level" role="rowheader">Added</span>
            {extra.map((l) => <LocationCell key={l.code} location={l} dimmed={dim(l)} onOpen={drawer.open} />)}
          </div>
        )}
      </div>
    </section>
  );
};
