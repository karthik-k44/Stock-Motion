import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, type RefObject } from 'react';
import { Vector3, type Object3D } from 'three';

type Props = {
  anchor: () => Object3D | null;
  card: RefObject<HTMLElement | null>;
  /** The element the card is positioned within */
  bounds: RefObject<HTMLElement | null>;
};

const GAP = 24;
const EDGE = 12;

/**
 * Keeps the stats card next to the selected object (never on top of it) and inside the screen,
 * every frame — so it follows a van driving around. Writes the card's transform directly, no re-render.
 */
export function CardTracker({ anchor, card, bounds }: Props) {
  const { camera, size } = useThree();
  const world = useMemo(() => new Vector3(), []);
  useFrame(() => {
    const target = anchor();
    const el = card.current;
    const box = bounds.current;
    if (!target || !el || !box) return;
    target.getWorldPosition(world);
    world.y += 1.5;
    world.project(camera);
    const x = ((world.x + 1) / 2) * size.width;
    const y = ((1 - world.y) / 2) * size.height;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    // Right of the object when it fits, otherwise left; vertically centred, clamped to the canvas.
    let left = x + GAP + w <= box.clientWidth - EDGE ? x + GAP : x - GAP - w;
    left = Math.min(Math.max(left, EDGE), box.clientWidth - w - EDGE);
    const top = Math.min(Math.max(y - h / 2, EDGE), box.clientHeight - h - EDGE);
    el.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    el.style.opacity = '1';
  });
  return null;
}
