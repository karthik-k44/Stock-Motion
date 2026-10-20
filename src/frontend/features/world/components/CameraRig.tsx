import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, type OrthographicCamera } from 'three';
import { Clamp } from '@/frontend/lib/utils';
import type { CameraCommandType, InsetsType, WorldLayoutType } from '../types';

export const MIN_ZOOM = 6;
export const MAX_ZOOM = 90;
const ZOOM_STEP = 1.3;
const TURN = Math.PI / 4;
const TWEEN_S = 0.35;
const UP = new Vector3(0, 1, 0);

type OrbitType = {
  target: Vector3;
  update: () => void;
  addEventListener: (type: 'start', fn: () => void) => void;
  removeEventListener: (type: 'start', fn: () => void) => void;
};

type Props = {
  layout: WorldLayoutType;
  /** Space the floating panels cover; the world is fitted and centred in what is left */
  insets: InsetsType;
  /** Bumped to put the camera back where it started */
  resetKey: number;
  command: CameraCommandType;
  animate: boolean;
};

type TweenType = { from: number; to: number; turn: number; done: number; t: number };

/** Fits the whole world into the free area at start, on resize and on reset; runs the toolbar's zoom and turn buttons. */
export const CameraRig = ({ layout, insets, resetKey, command, animate }: Props) => {
  const { camera, size, controls } = useThree();
  const tween = useRef<TweenType | null>(null);
  const orbit = controls as unknown as OrbitType | null;
  const { top, right, bottom, left } = insets;

  useEffect(() => {
    const cam = camera as OrthographicCamera;
    const [gw, gd] = layout.size;
    const span = gw + gd;
    const w = Math.max(200, size.width - left - right);
    const h = Math.max(160, size.height - top - bottom);
    cam.position.set(30, 32, 30);
    // An isometric diamond is about 0.71 × (width + depth) across; a little margin on top of that.
    cam.zoom = Clamp(Math.min(w / (span * 0.74), h / (span * 0.42)), MIN_ZOOM, MAX_ZOOM);
    // Shift the picture so the world's centre sits in the middle of the free area, not under a panel.
    cam.setViewOffset(size.width, size.height, (right - left) / 2, (bottom - top) / 2, size.width, size.height);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
    orbit?.target.set(0, 0, 0);
    orbit?.update();
    tween.current = null;
  }, [camera, orbit, size.width, size.height, layout, resetKey, top, right, bottom, left]);

  useEffect(() => {
    if (!command.n) return;
    const cam = camera as OrthographicCamera;
    const factor = command.kind === 'zoomIn' ? ZOOM_STEP : command.kind === 'zoomOut' ? 1 / ZOOM_STEP : 1;
    const turn = command.kind === 'rotateLeft' ? TURN : command.kind === 'rotateRight' ? -TURN : 0;
    tween.current = { from: cam.zoom, to: Clamp(cam.zoom * factor, MIN_ZOOM, MAX_ZOOM), turn, done: 0, t: animate ? 0 : 1 };
  }, [camera, command, animate]);

  // Dragging the scene takes over from a running button move.
  useEffect(() => {
    if (!orbit) return;
    const stop = () => (tween.current = null);
    orbit.addEventListener('start', stop);
    return () => orbit.removeEventListener('start', stop);
  }, [orbit]);

  useFrame((_, delta) => {
    const tw = tween.current;
    if (!tw) return;
    const cam = camera as OrthographicCamera;
    tw.t = Math.min(1, tw.t + delta / TWEEN_S);
    const eased = 1 - (1 - tw.t) ** 3;
    cam.zoom = tw.from + (tw.to - tw.from) * eased;
    cam.updateProjectionMatrix();
    if (tw.turn) {
      const target = orbit?.target ?? new Vector3();
      const step = tw.turn * eased - tw.done;
      tw.done += step;
      cam.position.sub(target).applyAxisAngle(UP, step).add(target);
      cam.lookAt(target);
    }
    orbit?.update();
    if (tw.t >= 1) tween.current = null;
  });

  return null;
};
