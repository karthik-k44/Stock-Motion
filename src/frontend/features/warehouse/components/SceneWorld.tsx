import { memo } from 'react';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import type { UserResponseType } from '@/frontend/features/users/types';
import { AISLES } from '../lib/layout';
import type { TruckState } from '../lib/truck-store';
import { Building } from './Building';
import { CrewLayer } from './CrewLayer';
import { PackingStation } from './PackingStation';
import { Rack } from './Rack';
import { StagingArea } from './StagingArea';
import { Truck } from './Truck';
import { Yard } from './Yard';

type Props = {
  truck: TruckState;
  byLocation: Map<string, ItemResponseType>;
  revealed: number;
  highlightSku: string | null;
  packed: string[];
  users: UserResponseType[];
  actingUserId: string;
  onHover: (item: ItemResponseType | null, el: HTMLElement | null) => void;
  onSelect: (item: ItemResponseType) => void;
};

/** Everything inside the warehouse, laid out in world units (see lib/layout). */
export const SceneWorld = memo(function SceneWorld(p: Props) {
  const doorOpen = ['PARKING', 'UNLOADING', 'RECEIVED'].includes(p.truck.phase);
  return (
    <>
      <Yard bayBusy={p.truck.phase !== 'IDLE'} />
      <Building doorOpen={doorOpen} />
      <StagingArea truck={p.truck} />
      {AISLES.map((a, i) => (
        <Rack
          key={a}
          aisle={a}
          byLocation={p.byLocation}
          revealed={i < p.revealed}
          highlightSku={p.highlightSku}
          onHover={p.onHover}
          onSelect={p.onSelect}
        />
      ))}
      <PackingStation packed={p.packed} />
      <Truck truck={p.truck} />
      <CrewLayer users={p.users} actingUserId={p.actingUserId} />
    </>
  );
});
