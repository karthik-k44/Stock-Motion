import { DOCK_X, FLOOR_Y, TRUCK_PARKED_X, TRUCK_W } from '../lib/layout';

/** Outdoor loading yard: asphalt, the Dock 1 parking bay, a lamp post and the gate booth. */
export function Yard({ bayBusy }: { bayBusy: boolean }) {
  return (
    <div className="yard" style={{ width: DOCK_X, top: FLOOR_Y }} aria-hidden>
      <div className="yard-asphalt" />
      <div className="bay" style={{ left: TRUCK_PARKED_X - 10, width: TRUCK_W + 14 }}>
        <span className="bay-line bay-line-l" />
        <span className="bay-line bay-line-r" />
        <span className="bay-text">{bayBusy ? 'BAY 1 · OCCUPIED' : 'BAY 1 · FREE'}</span>
      </div>
      <div className="wheel-stop" style={{ left: DOCK_X - 26 }} />
      <div className="booth" style={{ left: 18 }}>
        <span className="booth-window" />
        <span className="booth-sign">GATE</span>
      </div>
      <div className="lamp" style={{ left: 118 }}>
        <span className="lamp-head" />
      </div>
    </div>
  );
}
