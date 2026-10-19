import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { Group, OrthographicCamera as OrthoCamera } from 'three';
import type { WorldContextType, WorldLayoutType } from '../types';
import { CardTracker } from './CardTracker';
import { FollowPath, Person } from './models/Movers';
import { Scenery } from './Scenery';
import { WorldObject } from './WorldObject';

type Props = {
  layout: WorldLayoutType;
  ctx: WorldContextType;
  selected: string | null;
  onSelect: (id: string | null) => void;
  animate: boolean;
  lite: boolean;
  teamColors: string[];
  card: RefObject<HTMLElement | null>;
  bounds: RefObject<HTMLElement | null>;
  /** Bumped to put the camera back where it started */
  resetKey: number;
};

/** Fits the whole world on screen at start, on resize and on reset. */
function CameraRig({ layout, resetKey }: { layout: WorldLayoutType; resetKey: number }) {
  const { camera, size, controls } = useThree();
  useEffect(() => {
    const [gw, gd] = layout.size;
    const span = gw + gd;
    const cam = camera as OrthoCamera;
    cam.position.set(30, 32, 30);
    // An isometric diamond is about 0.71 × (width + depth) across; a little margin on top of that.
    cam.zoom = Math.min(size.width / (span * 0.74), size.height / (span * 0.42));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
    const orbit = controls as unknown as { target?: { set: (x: number, y: number, z: number) => void }; update?: () => void } | null;
    orbit?.target?.set(0, 0, 0);
    orbit?.update?.();
  }, [camera, size.width, size.height, layout, resetKey, controls]);
  return null;
}

export function WorldCanvas({ layout, ctx, selected, onSelect, animate, lite, teamColors, card, bounds, resetKey }: Props) {
  const anchors = useRef(new Map<string, Group>());
  const register = useCallback((id: string, g: Group | null) => {
    if (g) anchors.current.set(id, g);
    else anchors.current.delete(id);
  }, []);
  const walkers = layout.walkers.slice(0, Math.min(layout.walkers.length, Math.max(2, ctx.dashboard.kpis.team + 1), lite ? 3 : 5));

  return (
    <Canvas shadows={!lite} dpr={lite ? [1, 1.5] : [1, 2]} onPointerMissed={() => onSelect(null)} aria-hidden>
      <color attach="background" args={['#eef2f6']} />
      <OrthographicCamera makeDefault position={[30, 32, 30]} near={-200} far={400} />
      <CameraRig layout={layout} resetKey={resetKey} />
      <OrbitControls makeDefault enablePan={false} enableDamping minZoom={6} maxZoom={90} minPolarAngle={0.35} maxPolarAngle={1.2} />
      <hemisphereLight args={['#ffffff', '#b9c7a8', 0.85]} />
      <directionalLight
        position={[18, 30, 14]}
        intensity={1.7}
        castShadow={!lite}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0004}
      />
      <Scenery layout={layout} />
      {layout.objects.map((spec) => (
        <WorldObject
          key={spec.id}
          spec={spec}
          ctx={ctx}
          layout={layout}
          selected={selected === spec.id}
          animate={animate}
          onSelect={onSelect}
          registerAnchor={register}
        />
      ))}
      {walkers.map((route, i) => (
        <FollowPath key={i} route={route} speed={1.4} animate={animate} offset={i * 0.37}>
          <Person color={teamColors[i % Math.max(1, teamColors.length)] ?? '#2b4c7e'} animate={animate} />
        </FollowPath>
      ))}
      {selected && <CardTracker anchor={() => anchors.current.get(selected) ?? null} card={card} bounds={bounds} />}
    </Canvas>
  );
}
