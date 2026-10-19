import { useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { paths } from '@/frontend/config/paths';
import { AISLE_INFO, type AisleId } from '@/frontend/features/warehouse/lib/layout';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import type { LocationResponseType } from '../types';
import { LocationCell } from './LocationCell';

type Props = { aisle: AisleId; locations: LocationResponseType[]; issuesOnly: boolean };

/** One aisle as the rack looks from the floor: shelf 3 on top, bins 1–4 left to right. */
export function AisleGrid({ aisle, locations, issuesOnly }: Props) {
  const navigate = useNavigate();
  const drawer = useItemDrawer();
  const occupied = locations.filter((l) => l.item).length;
  const units = locations.reduce((s, l) => s + (l.item?.onHand ?? 0), 0);
  const levels = [3, 2, 1];

  return (
    <section className="card aisle" aria-labelledby={`aisle-${aisle}`}>
      <header className="card-head">
        <div>
          <h2 id={`aisle-${aisle}`} className="card-title">
            Aisle {aisle} · {AISLE_INFO[aisle].label}
          </h2>
          <p className="card-subtitle">
            {occupied} of {locations.length} bins used · {units.toLocaleString('en-US')} units
          </p>
        </div>
        <Button size="sm" icon="locate" onClick={() => navigate(paths.locateZone(aisle))}>
          View on floor
        </Button>
      </header>
      <div className="aisle-grid" role="grid" aria-label={`Aisle ${aisle} bins`}>
        {levels.map((level) => (
          <div key={level} role="row" className="aisle-row">
            <span className="aisle-level" role="rowheader">
              Shelf {level}
            </span>
            {locations
              .filter((l) => l.level === level)
              .sort((a, b) => a.bin - b.bin)
              .map((l) => (
                <LocationCell key={l.code} location={l} dimmed={issuesOnly && (!l.item || l.item.status === 'IN_STOCK')} onOpen={drawer.open} />
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
