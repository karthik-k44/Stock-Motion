import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { Block } from './Block';

/** A small office cabin with a pitched roof and a lit window. */
export function Office({ accent }: { accent: string }) {
  return (
    <group>
      <Block size={[3.4, 2.2, 2.8]} color="#f4f1ea" radius={0.1} />
      <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.7, 0.9, 4]} />
        <meshStandardMaterial color={accent} roughness={0.7} />
      </mesh>
      <Block size={[1.2, 0.7, 0.05]} position={[-0.6, 1, 1.41]} color="#ffe9a8" emissive="#ffcf55" emissiveIntensity={0.35} radius={0.02} />
      <Block size={[0.7, 1.4, 0.05]} position={[0.9, 0, 1.41]} color="#8a6a4a" radius={0.02} />
    </group>
  );
}

/** Packing bench with boxes and a tape roll. */
export function Bench() {
  return (
    <group>
      <Block size={[3.2, 0.9, 1.4]} color="#9c6b43" radius={0.06} />
      <Block size={[0.9, 0.6, 0.7]} position={[-0.8, 0.9, 0]} color="#c8955a" radius={0.05} />
      <Block size={[0.6, 0.45, 0.5]} position={[0.4, 0.9, 0.1]} color="#d8a86a" radius={0.05} />
      <mesh position={[1.1, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.16, 0.07, 8, 16]} />
        <meshStandardMaterial color="#f2c230" />
      </mesh>
    </group>
  );
}

/** The café counter. */
export function Counter({ accent }: { accent: string }) {
  return (
    <group>
      <Block size={[9, 1, 1.3]} color={accent} radius={0.1} />
      <Block size={[9.2, 0.1, 1.5]} position={[0, 1, 0]} color="#efe7da" radius={0.05} />
    </group>
  );
}

/** Till with its screen, on the counter. */
export function Till() {
  return (
    <group position={[0, 1.1, 0]}>
      <Block size={[0.9, 0.35, 0.7]} color="#2e3440" radius={0.06} />
      <Block size={[0.7, 0.45, 0.06]} position={[0, 0.35, -0.15]} color="#1b2230" emissive="#3fd18a" emissiveIntensity={0.5} radius={0.02} />
    </group>
  );
}

/** Espresso machine; steam rises while there are tickets being prepared. */
export function CoffeeMachine({ working, animate }: { working: boolean; animate: boolean }) {
  const steam = useRef<Group>(null);
  useFrame((state) => {
    if (!steam.current) return;
    const t = state.clock.elapsedTime;
    steam.current.children.forEach((puff, i) => {
      const phase = (t * 0.6 + i / 3) % 1;
      puff.position.y = 1.0 + phase * 0.9;
      puff.scale.setScalar(working && animate ? 0.15 + phase * 0.25 : 0.0001);
    });
  });
  return (
    <group position={[0, 1.1, 0]}>
      <Block size={[1.3, 0.9, 0.8]} color="#b8bec7" radius={0.1} />
      <Block size={[1.1, 0.12, 0.6]} position={[0, 0.9, 0]} color="#6b7380" radius={0.04} />
      <Block size={[0.25, 0.2, 0.25]} position={[-0.3, 0.2, 0.4]} color="#f4f1ea" radius={0.05} />
      <Block size={[0.25, 0.2, 0.25]} position={[0.3, 0.2, 0.4]} color="#f4f1ea" radius={0.05} />
      <group ref={steam}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 1, 0]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** A row of round tables with stools. */
export function Tables({ count }: { count: number }) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const x = (i % 3) * 3.2 - 3.2;
        const z = Math.floor(i / 3) * 2.8 - 0.6;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.7, 0.7, 0.08, 20]} />
              <meshStandardMaterial color="#f4ece0" />
            </mesh>
            <mesh position={[0, 0.42, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.12, 0.85, 10]} />
              <meshStandardMaterial color="#5b4636" />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 1.05, 0.28, 0]} castShadow>
                <cylinderGeometry args={[0.28, 0.28, 0.55, 14]} />
                <meshStandardMaterial color="#7a4a2a" />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/** Customers' houses where jobs are happening; each has a roof and a little work flag. */
export function Houses({ count, accent }: { count: number; accent: string }) {
  const colors = ['#f1e3cf', '#dfe9f2', '#e9f0dc', '#f4dcdc'];
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const x = (i % 2) * 4.6 - 2.3;
        const z = Math.floor(i / 2) * 5 - 2.5;
        return (
          <group key={i} position={[x, 0, z]}>
            <Block size={[3, 1.9, 2.6]} color={colors[i % colors.length]} radius={0.08} />
            <mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[2.4, 1, 4]} />
              <meshStandardMaterial color="#9b4d3b" />
            </mesh>
            <Block size={[0.06, 1.4, 0.06]} position={[1.7, 0, 1.4]} color="#555" radius={0.02} />
            <Block size={[0.5, 0.32, 0.03]} position={[1.95, 1.05, 1.4]} color={accent} radius={0.01} />
          </group>
        );
      })}
    </group>
  );
}
