import { FLOOR_Y, TRUCK_PARKED_X } from '../lib/layout';
import { TRUCK_PHASE_LABEL, type TruckState } from '../lib/truck-store';

const X = { IDLE: -640, APPROACHING: 46, PARKING: TRUCK_PARKED_X, UNLOADING: TRUCK_PARKED_X, RECEIVED: TRUCK_PARKED_X, DEPARTING: -720 };
const WHEELS = [60, 330, 382, 440];

/** Delivery truck. It reverses into Dock 1, waits while unloading, then drives off. */
export function Truck({ truck }: { truck: TruckState }) {
  const { phase, delivery, unloaded } = truck;
  const lines = Math.min(6, delivery?.lines.length ?? 0);
  const status =
    phase === 'UNLOADING' ? `Unloading ${unloaded}/${lines}` : truck.failed ? 'Receiving failed' : TRUCK_PHASE_LABEL[phase];

  return (
    <div
      className={`truck truck-${phase.toLowerCase()}`}
      style={{ transform: `translateX(${X[phase]}px)`, top: FLOOR_Y - 210 }}
      aria-hidden
    >
      {phase !== 'IDLE' && delivery && (
        <div className="truck-banner">
          <strong>{delivery.truck}</strong> · {delivery.id}
          <span className="truck-banner-status">{status}</span>
        </div>
      )}
      <svg viewBox="0 0 500 214" width="500" height="214">
        <ellipse cx="250" cy="208" rx="240" ry="6" fill="rgba(0,0,0,.22)" />
        <rect x="118" y="8" width="380" height="168" rx="4" fill="#f3f4f6" stroke="#c4c9d1" strokeWidth="2" />
        {[160, 200, 240, 280, 320, 360, 400, 440].map((x) => (
          <line key={x} x1={x} y1="14" x2={x} y2="170" stroke="#e1e4e9" strokeWidth="2" />
        ))}
        <rect x="118" y="118" width="380" height="14" fill="#2b4c7e" />
        <text x="306" y="84" textAnchor="middle" fontSize="26" fontWeight="700" fill="#2b4c7e" fontFamily="system-ui, sans-serif">
          {delivery?.supplier.split(' ')[0] ?? 'FREIGHT'}
        </text>
        <rect x="484" y="12" width="12" height="160" fill="#d7dbe1" />
        <rect className="rev-light" x="488" y="148" width="8" height="14" rx="2" />
        <rect x="20" y="176" width="472" height="10" fill="#363b43" />
        <rect x="10" y="62" width="110" height="116" rx="12" fill="#c8432f" />
        <path d="M14 72 L52 72 L52 116 L14 116 Z" fill="#a9cbe6" />
        <rect x="58" y="72" width="44" height="38" rx="3" fill="#a9cbe6" />
        <rect x="4" y="130" width="10" height="36" rx="2" fill="#8d2c1f" />
        <rect x="2" y="166" width="34" height="12" rx="3" fill="#2d3138" />
        <rect className="head-light" x="4" y="122" width="8" height="8" rx="2" />
        {WHEELS.map((cx) => (
          <g key={cx} transform={`translate(${cx} 188)`}>
            <g className="wheel">
              <circle r="20" fill="#202328" />
              <circle r="9" fill="#9aa1ab" />
              <line x1="-9" y1="0" x2="9" y2="0" stroke="#5b616a" strokeWidth="3" />
              <line x1="0" y1="-9" x2="0" y2="9" stroke="#5b616a" strokeWidth="3" />
            </g>
          </g>
        ))}
      </svg>
      <span className="exhaust" />
    </div>
  );
}
