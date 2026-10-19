import { FLOOR_Y, PACK_X, SHIP_DOOR_X } from '../lib/layout';

/** Packing benches and the outbound conveyor. Parcels = orders packed and waiting to ship. */
export function PackingStation({ packed }: { packed: string[] }) {
  return (
    <div className="packing" style={{ left: PACK_X - 60, top: FLOOR_Y - 120 }} aria-hidden>
      <div className="bench">
        <span className="bench-top" />
        <span className="bench-leg bench-leg-l" />
        <span className="bench-leg bench-leg-r" />
        <span className="tape-gun" />
      </div>
      <div className="conveyor" style={{ left: 230, width: SHIP_DOOR_X - (PACK_X - 60) - 230 }}>
        <span className="conveyor-belt" />
      </div>
      <div className="parcels">
        {packed.slice(0, 8).map((id, i) => (
          <span key={id} className="parcel" style={{ left: 236 + (i % 4) * 30, bottom: 46 + Math.floor(i / 4) * 26 }}>
            <span className="parcel-label">{id.replace('SO-', '')}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
