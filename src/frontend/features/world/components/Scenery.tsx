import type { WorldLayoutType, XZType } from '../types';
import { Block } from './models/Block';

/** A road ribbon along a closed loop. */
const Road = ({ points, color }: { points: XZType[]; color: string }) => {
  return (
    <>
      {points.map(([x1, z1], i) => {
        const [x2, z2] = points[(i + 1) % points.length];
        const length = Math.hypot(x2 - x1, z2 - z1);
        if (length < 0.01) return null;
        return (
          <mesh key={i} position={[(x1 + x2) / 2, 0.02, (z1 + z2) / 2]} rotation={[-Math.PI / 2, 0, -Math.atan2(z2 - z1, x2 - x1)]} receiveShadow>
            <planeGeometry args={[length + 2.4, 2.4]} />
            <meshStandardMaterial color={color} roughness={0.95} />
          </mesh>
        );
      })}
    </>
  );
};

const Tree = ({ at }: { at: XZType }) => {
  return (
    <group position={[at[0], 0, at[1]]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
        <meshStandardMaterial color="#7a5a3a" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#5d9b4e" flatShading />
      </mesh>
    </group>
  );
};

/** Ground, the building's floor with cut-away walls on its far sides, the road and trees. */
export const Scenery = ({ layout }: { layout: WorldLayoutType }) => {
  const [gw, gd] = layout.size;
  const { center, size } = layout.building;
  const [bw, bd] = size;
  const p = layout.palette;
  return (
    <group>
      <Block size={[gw, 0.6, gd]} position={[0, -0.6, 0]} color={p.ground} radius={0.4} />
      {layout.road && <Road points={layout.road} color={p.road} />}
      <group position={[center[0], 0, center[1]]}>
        <Block size={[bw, 0.12, bd]} color={p.floor} radius={0.06} />
        <Block size={[bw, 1.6, 0.3]} position={[0, 0.12, -bd / 2]} color={p.wall} radius={0.08} />
        <Block size={[0.3, 1.6, bd]} position={[-bw / 2, 0.12, 0]} color={p.wall} radius={0.08} />
        <Block size={[bw, 0.25, 0.32]} position={[0, 1.72, -bd / 2]} color={p.accent} radius={0.06} />
        <Block size={[0.32, 0.25, bd]} position={[-bw / 2, 1.72, 0]} color={p.accent} radius={0.06} />
      </group>
      {layout.trees.map((t) => <Tree key={`${t[0]},${t[1]}`} at={t} />)}
    </group>
  );
};
