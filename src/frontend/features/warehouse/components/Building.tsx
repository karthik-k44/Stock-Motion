import { Cn } from '@/frontend/lib/utils';
import { AISLES, aisleX, AISLE_INFO, DOCK_X, FLOOR_Y, PACK_X, RACK_W, SHIP_DOOR_X, WALL_W, WORLD_W } from '../lib/layout';

const LIGHTS = Array.from({ length: 13 }, (_, i) => DOCK_X + 120 + i * 240);

/** Cut-away warehouse shell: back wall, ceiling lights, floor markings, Dock 1 door and the outbound door. */
export function Building({ doorOpen }: { doorOpen: boolean }) {
  const interior = WORLD_W - DOCK_X;
  return (
    <div className="building" aria-hidden>
      <div className="wall-back" style={{ left: DOCK_X, width: interior, height: FLOOR_Y }} />
      <div className="ceiling" style={{ left: DOCK_X, width: interior }} />
      {LIGHTS.map((x) => (
        <span key={x} className="ceiling-light" style={{ left: x }}>
          <span className="light-cone" />
        </span>
      ))}
      <div className="floor" style={{ left: DOCK_X, width: interior, top: FLOOR_Y }}>
        <span className="floor-line" style={{ left: 40, width: interior - 80 }} />
      </div>

      <div className="dock-wall" style={{ left: DOCK_X, width: WALL_W, height: FLOOR_Y }}>
        <div className={Cn('dock-door', doorOpen && 'dock-door-open')}>
          <span className="dock-shutter" />
        </div>
        <span className="dock-light" data-on={doorOpen || undefined} />
      </div>
      <div className="sign sign-dock" style={{ left: DOCK_X + 70 }}>
        DOCK 1 · RECEIVING
      </div>

      {AISLES.map((a) => (
        <div key={a} className="sign sign-aisle" style={{ left: aisleX(a) + RACK_W / 2 - 110 }}>
          <span className="sign-aisle-letter">{a}</span>
          <span>{AISLE_INFO[a].label}</span>
        </div>
      ))}

      <div className="sign sign-pack" style={{ left: PACK_X - 40 }}>
        PACKING &amp; DISPATCH
      </div>
      <div className="ship-door" style={{ left: SHIP_DOOR_X, width: WORLD_W - SHIP_DOOR_X }}>
        <span className="ship-door-label">OUTBOUND</span>
      </div>
    </div>
  );
}
