import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { Clamp } from '@/frontend/lib/utils';
import { WORLD_H, WORLD_W } from '../lib/layout';
import { CameraFor, MaxCamera, SceneScale } from '../lib/scene-math';

export type SceneStageHandle = {
  /** Pan so world x is centred. */
  jumpTo: (worldX: number) => void;
  viewport: () => HTMLDivElement | null;
};

type Props = {
  ref?: Ref<SceneStageHandle>;
  /** Native horizontal scrolling (phones) instead of scroll-driven panning. */
  native: boolean;
  reduced: boolean;
  onCamera: (camX: number, viewWorldW: number) => void;
  hudTop: ReactNode;
  hudBottom: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
};

/**
 * The camera. Desktop: a tall track with a sticky viewport — page scroll pans
 * from the loading yard through the aisles to packing. Phones: a native
 * horizontally scrolling viewport.
 */
export function SceneStage({ ref, native, reduced, onCamera, hudTop, hudBottom, overlay, children }: Props) {
  const trackRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const pending = useRef<number | null>(null);
  const onCameraRef = useRef(onCamera);
  onCameraRef.current = onCamera;

  const [size, setSize] = useState({ w: 0, h: 0 });
  const scale = SceneScale(size.h || 600);
  const maxCam = MaxCamera(size.w, scale);
  // Anchor the floor to the bottom of the viewport; any spare height becomes sky.
  const offsetY = Math.max(0, size.h - WORLD_H * scale);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const apply = useCallback(
    (cam: number) => {
      if (!size.w) return;
      const world = worldRef.current;
      if (world) {
        world.style.transform = native
          ? `scale(${scale})`
          : `translate3d(${-cam * scale}px, ${offsetY}px, 0) scale(${scale})`;
      }
      if (farRef.current) farRef.current.style.transform = `translate3d(${-cam * scale * 0.3}px,0,0)`;
      onCameraRef.current(cam, size.w / scale);
    },
    [native, scale, offsetY, size.w],
  );

  const scrollGeometry = () => {
    const track = trackRef.current!;
    const sticky = stickyRef.current!;
    const top = parseFloat(getComputedStyle(sticky).top) || 0;
    return { track, top, range: Math.max(1, track.offsetHeight - sticky.offsetHeight) };
  };

  // Scroll-driven camera (desktop)
  useEffect(() => {
    if (native || !size.w) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const { track, top, range } = scrollGeometry();
      const progress = Clamp((top - track.getBoundingClientRect().top) / range, 0, 1);
      apply(progress * maxCam);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [native, size.w, apply, maxCam]);

  // Native scrolling (phones)
  useEffect(() => {
    if (!native || !size.w) return;
    const el = viewportRef.current!;
    const onScroll = () => apply(el.scrollLeft / scale);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [native, size.w, apply, scale]);

  const jumpTo = useCallback(
    (x: number) => {
      if (!size.w) {
        pending.current = x;
        return;
      }
      const cam = CameraFor(x, size.w, scale);
      const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
      if (native) {
        viewportRef.current?.scrollTo({ left: cam * scale, behavior });
        return;
      }
      const { track, top, range } = scrollGeometry();
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: trackTop - top + (maxCam ? cam / maxCam : 0) * range, behavior });
    },
    [size.w, scale, reduced, native, maxCam],
  );

  useEffect(() => {
    if (size.w && pending.current !== null) {
      const x = pending.current;
      pending.current = null;
      jumpTo(x);
    }
  }, [size.w, jumpTo]);

  useImperativeHandle(ref, () => ({ jumpTo, viewport: () => viewportRef.current }), [jumpTo]);

  return (
    <section
      ref={trackRef}
      className={native ? 'stage stage-native' : 'stage stage-scroll'}
      style={native ? undefined : { height: `calc(var(--stage-h) + ${Math.round(maxCam * scale)}px)` }}
      aria-label="Animated warehouse floor"
    >
      <div ref={stickyRef} className="stage-sticky">
        <div className="hud hud-top">{hudTop}</div>
        <div ref={viewportRef} className="stage-viewport">
          {!native && <div ref={farRef} className="far-layer" aria-hidden />}
          <div className="world-spacer" style={native ? { width: WORLD_W * scale, height: WORLD_H * scale } : undefined}>
            <div ref={worldRef} className="world" style={{ width: WORLD_W, height: WORLD_H }}>
              {children}
            </div>
          </div>
          {overlay}
        </div>
        <div className="hud hud-bottom">{hudBottom}</div>
      </div>
    </section>
  );
}
