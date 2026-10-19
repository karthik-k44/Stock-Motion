import { Cn } from '@/frontend/lib/utils';
import { ZONES, zoneCenter } from '../lib/layout';

/** Jump between warehouse zones; the current zone follows the camera. */
export function ZoneNav({ zone, onJump }: { zone: string; onJump: (x: number) => void }) {
  const current = ZONES.find((z) => z.id === zone);
  return (
    <nav className="zone-nav" aria-label="Warehouse zones">
      <p className="zone-current" aria-live="polite">
        <span className="muted small">Now viewing</span> {current?.label}
      </p>
      <ol className="zone-list">
        {ZONES.map((z) => (
          <li key={z.id}>
            <button
              type="button"
              className={Cn('zone-chip', z.id === zone && 'zone-chip-active')}
              aria-current={z.id === zone ? 'location' : undefined}
              onClick={() => onJump(zoneCenter(z.id))}
            >
              {z.short}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
