import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { CameraCommandType, InsetsType, WorldContextType, WorldLayoutType } from '../types';
import { CameraRig, MAX_ZOOM, MIN_ZOOM } from './CameraRig';
import { FollowPath, Person } from './models/Movers';
import { Scenery } from './Scenery';
import { WorldObject } from './WorldObject';

type Props = {
  layout: WorldLayoutType;
  ctx: WorldContextType;
  /** The object to ring: the selected one, or the one holding the selected record */
  highlighted: string | null;
  onSelect: (id: string | null) => void;
  animate: boolean;
  lite: boolean;
  /** One walker per team member, in their colour */
  teamColors: string[];
  tags: boolean;
  insets: InsetsType;
  resetKey: number;
  command: CameraCommandType;
};

export const SCENE_BACKGROUND = '#f6f2ee';

export const WorldCanvas = ({ layout, ctx, highlighted, onSelect, animate, lite, teamColors, tags, insets, resetKey, command }: Props) => {
  const walkers = layout.walkers.slice(0, Math.min(teamColors.length, lite ? 3 : 5));

  return (
    <Canvas shadows={!lite} dpr={lite ? [1, 1.5] : [1, 2]} onPointerMissed={() => onSelect(null)} aria-hidden>
      <color attach="background" args={[SCENE_BACKGROUND]} />
      <OrthographicCamera makeDefault position={[30, 32, 30]} near={-200} far={400} />
      <OrbitControls makeDefault enablePan={false} enableDamping minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} minPolarAngle={0.35} maxPolarAngle={1.2} />
      <CameraRig layout={layout} insets={insets} resetKey={resetKey} command={command} animate={animate} />
      <hemisphereLight args={['#ffffff', '#d9cbb8', 0.9]} />
      <directionalLight
        position={[18, 30, 14]}
        intensity={1.65}
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
          selected={highlighted === spec.id}
          animate={animate}
          tags={tags}
          compactTags={lite}
          onSelect={onSelect}
        />
      ))}
      {walkers.map((route, i) => (
        <FollowPath key={i} route={route} speed={1.4} animate={animate} offset={i * 0.37}>
          <Person color={teamColors[i]} animate={animate} />
        </FollowPath>
      ))}
    </Canvas>
  );
};
