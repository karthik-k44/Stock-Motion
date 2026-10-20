import { RoundedBox } from '@react-three/drei';

type BlockProps = {
  size: [number, number, number];
  /** Centre of the block's base (it sits on y). */
  position?: [number, number, number];
  color: string;
  radius?: number;
  emissive?: string;
  emissiveIntensity?: number;
  rotation?: [number, number, number];
};

/** A soft-edged low-poly box — every model is built from these. */
export const Block = ({ size, position = [0, 0, 0], color, radius = 0.08, emissive, emissiveIntensity = 0, rotation }: BlockProps) => {
  const [w, h, d] = size;
  return (
    <RoundedBox
      args={[w, h, d]}
      radius={Math.min(radius, w / 2.2, h / 2.2, d / 2.2)}
      smoothness={3}
      position={[position[0], position[1] + h / 2, position[2]]}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.75} metalness={0.05} emissive={emissive ?? '#000000'} emissiveIntensity={emissiveIntensity} />
    </RoundedBox>
  );
};
