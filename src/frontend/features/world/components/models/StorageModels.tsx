import type { StorageZoneType } from '@/frontend/features/businesses/types';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import type { LocationResponseType } from '@/frontend/features/locations/types';
import { Block } from './Block';

const CARTON = { IN_STOCK: '#c8955a', LOW: '#f2b233', OUT: '#e06060' } as const;
const BIN_W = 1.1;
const LEVEL_H = 0.95;

type StorageProps = { zone: StorageZoneType | undefined; locations: LocationResponseType[]; style: 'metal' | 'wood' | 'fridge' };

/** How full a stack looks: on hand against three times the reorder level. */
const fill = (i: ItemResponseType) => (i.onHand <= 0 ? 0.12 : Math.min(1, Math.max(0.25, i.onHand / Math.max(1, i.reorderLevel * 3))));

const Goods = ({ items, width, y }: { items: ItemResponseType[]; width: number; y: number }) => {
  const shown = items.slice(0, 4);
  const w = (width - 0.1) / Math.max(1, shown.length);
  return (
    <>
      {shown.map((item, i) => {
        const h = (LEVEL_H - 0.25) * fill(item);
        return (
          <Block
            key={item.sku}
            size={[w - 0.08, h, 0.75]}
            position={[-width / 2 + 0.05 + w * i + w / 2, y, 0]}
            color={CARTON[item.status]}
            emissive={item.status === 'OUT' ? '#ff2a2a' : undefined}
            emissiveIntensity={item.status === 'OUT' ? 0.35 : 0}
            radius={0.05}
          />
        );
      })}
    </>
  );
};

/** Shelving drawn from the zone's real layout: levels × bins, each slot holding its live stock. */
export const Shelving = ({ zone, locations, style }: StorageProps) => {
  const levels = Math.max(1, zone?.levels ?? 3);
  const bins = Math.max(1, zone?.bins ?? 1);
  const binW = bins > 1 ? BIN_W : 2.4;
  const width = bins * binW + 0.2;
  const frame = style === 'wood' ? '#9c6b43' : style === 'fridge' ? '#d9e2ea' : '#3e5a86';
  const board = style === 'wood' ? '#c99a6b' : style === 'fridge' ? '#eef3f7' : '#f2c230';
  const code = (level: number, bin: number) =>
    !zone ? '' : bins > 1 ? `${zone.code}-${level}-${bin}` : levels > 1 ? `${zone.code}-${level}` : zone.code;

  return (
    <group>
      {style === 'fridge' && (
        <>
          <Block size={[width + 0.4, levels * LEVEL_H + 0.5, 1.5]} position={[0, 0, -0.2]} color="#f4f7fa" radius={0.15} />
          <mesh position={[0, (levels * LEVEL_H + 0.5) / 2, 0.58]}>
            <boxGeometry args={[width + 0.2, levels * LEVEL_H + 0.3, 0.04]} />
            <meshPhysicalMaterial color="#bfe3ff" transparent opacity={0.28} roughness={0.05} />
          </mesh>
        </>
      )}
      {[-width / 2, width / 2].map((x) => (
        <Block key={x} size={[0.12, levels * LEVEL_H + 0.3, 1]} position={[x, 0, 0]} color={frame} radius={0.03} />
      ))}
      {Array.from({ length: levels }, (_, li) => {
        const level = li + 1;
        const y = 0.15 + li * LEVEL_H;
        return (
          <group key={level}>
            <Block size={[width, 0.08, 1]} position={[0, y - 0.08, 0]} color={board} radius={0.02} />
            {Array.from({ length: bins }, (_, bi) => {
              const items = locations.find((l) => l.code === code(level, bi + 1))?.items ?? [];
              return (
                <group key={bi} position={[-width / 2 + 0.1 + binW * bi + binW / 2, 0, 0]}>
                  <Goods items={items} width={binW} y={y} />
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

/** A chest freezer with its drawers' goods visible from above. */
export const Freezer = ({ locations }: Omit<StorageProps, 'style' | 'zone'>) => {
  const items = locations.flatMap((l) => l.items);
  return (
    <group>
      <Block size={[3, 1.1, 1.6]} color="#f4f7fa" radius={0.15} />
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[2.7, 0.04, 1.3]} />
        <meshPhysicalMaterial color="#cfeaff" transparent opacity={0.4} roughness={0.05} />
      </mesh>
      <group position={[0, 0.55, 0]}>
        <Goods items={items} width={2.6} y={0} />
      </group>
    </group>
  );
};

/** A glass display case on the counter. */
export const Display = ({ locations }: Omit<StorageProps, 'style' | 'zone'>) => {
  const items = locations.flatMap((l) => l.items);
  return (
    <group position={[0, 1.05, 0]}>
      <Block size={[2.6, 0.12, 1.1]} color="#d9c2a3" radius={0.04} />
      <Goods items={items} width={2.4} y={0.12} />
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[2.6, 0.9, 1.1]} />
        <meshPhysicalMaterial color="#e8f5ff" transparent opacity={0.22} roughness={0.05} />
      </mesh>
    </group>
  );
};

/** Pallets in the yard, one stack per stored item. */
export const Pallets = ({ locations }: Omit<StorageProps, 'style' | 'zone'>) => {
  const items = locations.flatMap((l) => l.items).slice(0, 6);
  return (
    <group>
      {items.map((item, i) => {
        const x = (i % 3) * 1.6 - 1.6;
        const z = Math.floor(i / 3) * 1.6 - 0.8;
        return (
          <group key={item.sku} position={[x, 0, z]}>
            <Block size={[1.3, 0.15, 1.3]} color="#b98b55" radius={0.02} />
            <Block size={[1.1, 1.4 * fill(item), 1.1]} position={[0, 0.15, 0]} color={CARTON[item.status]} radius={0.06} />
          </group>
        );
      })}
      {!items.length && <Block size={[1.3, 0.15, 1.3]} color="#b98b55" radius={0.02} />}
    </group>
  );
};
