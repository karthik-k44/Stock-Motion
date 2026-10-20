import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import { CatmullRomCurve3, Vector3, type Group } from 'three';
import type { XZType } from '../../types';
import { Block } from './Block';

/** Moves its children around a closed loop at `speed` world units per second. */
export const FollowPath = ({ route, speed, animate, offset = 0, children }: { route: XZType[]; speed: number; animate: boolean; offset?: number; children: ReactNode }) => {
  const ref = useRef<Group>(null);
  const curve = useMemo(() => new CatmullRomCurve3(route.map(([x, z]) => new Vector3(x, 0, z)), true, 'catmullrom', 0.1), [route]);
  const length = useMemo(() => curve.getLength(), [curve]);
  const ahead = useMemo(() => new Vector3(), []);
  useFrame((state) => {
    if (!ref.current) return;
    const t = animate ? ((state.clock.elapsedTime * speed) / length + offset) % 1 : offset;
    const p = curve.getPointAt(t);
    curve.getPointAt((t + 0.002) % 1, ahead);
    ref.current.position.copy(p);
    ref.current.lookAt(ahead.x, 0, ahead.z);
  });
  return <group ref={ref}>{children}</group>;
};

/** A person: vest colour from their team member colour, a gentle walk bob. */
export const Person = ({ color, animate }: { color: string; animate: boolean }) => {
  const body = useRef<Group>(null);
  useFrame((state) => {
    if (body.current && animate) body.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 7)) * 0.08;
  });
  return (
    <group ref={body}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.5, 4, 10]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <sphereGeometry args={[0.2, 14, 12]} />
        <meshStandardMaterial color="#e0b48f" />
      </mesh>
    </group>
  );
};

const Wheels = ({ xs, z }: { xs: number[]; z: number }) => {
  return (
    <>
      {xs.flatMap((x) =>
        [-z, z].map((zz) => (
          <mesh key={`${x}${zz}`} position={[x, 0.32, zz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.25, 14]} />
            <meshStandardMaterial color="#22262d" />
          </mesh>
        )),
      )}
    </>
  );
};

/** A box truck. Faces +z (the direction it drives along a path). */
export const Truck = ({ color }: { color: string }) => {
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <Block size={[3.6, 1.9, 1.7]} position={[-0.6, 0.45, 0]} color="#f4f4f0" radius={0.12} />
      <Block size={[1.3, 1.4, 1.6]} position={[1.85, 0.45, 0]} color={color} radius={0.18} />
      <Block size={[0.06, 0.6, 1.3]} position={[2.5, 1.1, 0]} color="#bfe3ff" radius={0.02} />
      <Wheels xs={[-1.7, 0.4, 1.9]} z={0.8} />
    </group>
  );
};

/** A delivery / service van. Faces +z. */
export const Van = ({ color }: { color: string }) => {
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <Block size={[3, 1.4, 1.5]} position={[-0.2, 0.4, 0]} color={color} radius={0.25} />
      <Block size={[0.9, 0.5, 1.3]} position={[1.1, 1.0, 0]} color="#bfe3ff" radius={0.1} />
      <Wheels xs={[-1.1, 0.9]} z={0.72} />
    </group>
  );
};
