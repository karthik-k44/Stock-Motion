import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, MeshBasicMaterial } from 'three';
import type { WorldContextType, WorldLayoutType, WorldObjectSpecType } from '../types';
import { FollowPath } from './models/Movers';
import { ObjectModel } from './ObjectModel';
import { ObjectTag } from './ObjectTag';

type Props = {
  spec: WorldObjectSpecType;
  ctx: WorldContextType;
  layout: WorldLayoutType;
  selected: boolean;
  animate: boolean;
  tags: boolean;
  compactTags: boolean;
  onSelect: (id: string) => void;
};

const RING_ON = '#ea580c';
const RING_ALERT = '#dc3c3c';

/** One clickable object: hover cursor, a glowing ring when selected, a red pulse on stock alerts, its live tag. */
export const WorldObject = ({ spec, ctx, layout, selected, animate, tags, compactTags, onSelect }: Props) => {
  const ring = useRef<Mesh>(null);
  const alerting = Boolean(spec.alert?.(ctx));
  const present = spec.present?.(ctx) ?? true;
  const moving = present && Boolean(spec.route && spec.moving?.(ctx));

  useFrame((state) => {
    if (!ring.current) return;
    const material = ring.current.material as MeshBasicMaterial;
    const t = state.clock.elapsedTime;
    const pulse = animate ? (Math.sin(t * 4) + 1) / 2 : 0.6;
    // An empty bay (no vehicle on record) keeps a faint outline so it can still be found and clicked.
    const idle = present ? 0 : 0.28;
    material.opacity = selected ? 0.75 + pulse * 0.25 : alerting ? 0.25 + pulse * 0.45 : idle;
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
    <group {...handlers}>
      {present && <ObjectModel spec={spec} ctx={ctx} layout={layout} animate={animate} />}
      <mesh ref={ring} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 2.3, 48]} />
        <meshBasicMaterial color={alerting && !selected ? RING_ALERT : RING_ON} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Invisible pad so an empty bay still catches clicks */}
      {!present && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <circleGeometry args={[2.3, 24]} />
        </mesh>
      )}
      {tags && <ObjectTag spec={spec} tag={spec.tag(ctx)} selected={selected} compact={compactTags} onSelect={onSelect} />}
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
};
