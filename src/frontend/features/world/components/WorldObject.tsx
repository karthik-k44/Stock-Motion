import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import type { WorldContextType, WorldLayoutType, WorldObjectSpecType } from '../types';
import { FollowPath } from './models/Movers';
import { ObjectModel } from './ObjectModel';

type Props = {
  spec: WorldObjectSpecType;
  ctx: WorldContextType;
  layout: WorldLayoutType;
  selected: boolean;
  animate: boolean;
  onSelect: (id: string) => void;
  /** Gives the selection card a point to follow, even while the object drives around */
  registerAnchor: (id: string, anchor: Group | null) => void;
};

/** One clickable object: hover cursor, a glowing ring when selected, a red pulse on stock alerts. */
export function WorldObject({ spec, ctx, layout, selected, animate, onSelect, registerAnchor }: Props) {
  const ring = useRef<Mesh>(null);
  const alerting = Boolean(spec.alert?.(ctx));
  const moving = Boolean(spec.route && spec.moving?.(ctx));

  useFrame((state) => {
    if (!ring.current) return;
    const material = ring.current.material as MeshBasicMaterial;
    const t = state.clock.elapsedTime;
    const pulse = animate ? (Math.sin(t * 4) + 1) / 2 : 0.6;
    material.opacity = selected ? 0.75 + pulse * 0.25 : alerting ? 0.25 + pulse * 0.45 : 0;
    ring.current.scale.setScalar(selected ? 1 + pulse * 0.06 : 1);
  });

  const handlers = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(spec.id);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      document.body.style.cursor = '';
    },
  };

  const body = (
    <group ref={(g) => registerAnchor(spec.id, g)} {...handlers}>
      <ObjectModel spec={spec} ctx={ctx} layout={layout} animate={animate} />
      <mesh ref={ring} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 2.3, 48]} />
        <meshBasicMaterial color={alerting && !selected ? '#ff4d4d' : '#46a0ff'} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );

  if (moving) {
    return (
      <FollowPath route={spec.route!} speed={spec.model === 'truck' ? 3.2 : 4} animate={animate} offset={(spec.id.length % 7) / 7}>
        {body}
      </FollowPath>
    );
  }
  return (
    <group position={[spec.position[0], 0, spec.position[1]]} rotation={[0, spec.rotation ?? 0, 0]}>
      {body}
    </group>
  );
}
