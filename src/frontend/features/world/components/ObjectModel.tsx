import type { WorldContextType, WorldLayoutType, WorldObjectSpecType } from '../types';
import { Person, Truck, Van } from './models/Movers';
import { Bench, CoffeeMachine, Counter, Houses, Office, Tables, Till } from './models/PropModels';
import { Display, Freezer, Pallets, Shelving } from './models/StorageModels';

type Props = { spec: WorldObjectSpecType; ctx: WorldContextType; layout: WorldLayoutType; animate: boolean };

/** The low-poly model for one object, drawn from its live data. */
export function ObjectModel({ spec, ctx, layout, animate }: Props) {
  const zone = ctx.template.zones.find((z) => z.code === spec.zone);
  const locations = spec.zone ? ctx.locations.filter((l) => l.zone === spec.zone) : [];
  const accent = spec.color ?? layout.palette.accent;
  switch (spec.model) {
    case 'rack':
      return <Shelving zone={zone} locations={locations} style="metal" />;
    case 'shelf':
      return <Shelving zone={zone} locations={locations} style="wood" />;
    case 'fridge':
      return <Shelving zone={zone} locations={locations} style="fridge" />;
    case 'freezer':
      return <Freezer locations={locations} />;
    case 'display':
      return <Display locations={locations} />;
    case 'pallets':
      return <Pallets locations={locations} />;
    case 'truck':
      return <Truck color={accent} />;
    case 'van':
      return <Van color={accent} />;
    case 'bench':
      return <Bench />;
    case 'office':
      return <Office accent={accent} />;
    case 'counter':
      return <Counter accent={accent} />;
    case 'till':
      return <Till />;
    case 'coffee':
      return <CoffeeMachine working={ctx.dashboard.kpis.openOrders > 0} animate={animate} />;
    case 'tables':
      return (
        <group>
          <Tables count={spec.count?.(ctx) ?? 3} />
          {/* Seated guests: one per open ticket, up to a full room */}
          {Array.from({ length: Math.min(ctx.dashboard.kpis.openOrders, 6) }, (_, i) => (
            <group key={i} position={[(i % 3) * 3.2 - 3.2 + (i % 2 ? 1.05 : -1.05), 0.3, Math.floor(i / 3) * 2.8 - 0.6]}>
              <Person color={['#e86b2c', '#3a7bd5', '#b5487a', '#2f9e6d'][i % 4]} animate={false} />
            </group>
          ))}
        </group>
      );
    case 'houses':
      return <Houses count={spec.count?.(ctx) ?? 1} accent={accent} />;
  }
}
