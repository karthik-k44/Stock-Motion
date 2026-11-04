import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef } from 'react';
import { useMotion } from '@/frontend/hooks/use-motion';

gsap.registerPlugin(ScrollTrigger);
// One hero runs on every marketing page and not all of them have every tile.
gsap.config({ nullTargetWarn: false });

const EASE = 'power3.out';

/**
 * The marketing pages' motion. Every hook sets its opening state before the first paint, so nothing flashes, and with
 * motion off none of them runs at all: the markup is already the finished page.
 */

/** Everything the frame of the site does: the navbar drops in once and the footer's wordmark rises from behind its skyline. */
export const useFrameMotion = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();

  useLayoutEffect(() => {
    if (!ref.current || reduced) return;
    const ctx = gsap.context(() => {
      gsap.from('header', { yPercent: -100, duration: 0.8, ease: EASE, clearProps: 'transform' });
      const footer = { trigger: '.landing-footer', start: 'top 92%', end: 'bottom bottom', scrub: 0.6 };
      gsap.from('.landing-footer-mark', { yPercent: 52, ease: 'none', scrollTrigger: footer });
      gsap.from('[data-footer-scene]', { yPercent: 9, ease: 'none', scrollTrigger: footer });
    }, ref);
    return () => ctx.revert();
  }, [reduced]);

  return ref;
};

/**
 * Goes on a page's root. Marks in the markup choose the motion:
 * `data-reveal` fades an element up as it scrolls in, `data-reveal-group` does that to its children one after another,
 * `data-pop` springs an element in and leaves it drifting, `data-parallax="8"` moves an image that many percent
 * through its frame while the page scrolls past it, `data-progress` fills a line as its container is scrolled through,
 * and `data-step` gets `is-reached` once the reader gets to it.
 */
export const usePageMotion = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();

  useLayoutEffect(() => {
    if (!ref.current || reduced) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, { autoAlpha: 0, y: 32, duration: 0.9, ease: EASE, clearProps: 'transform', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
      gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
        gsap.from(group.children, { autoAlpha: 0, y: 40, duration: 0.85, stagger: 0.09, ease: EASE, clearProps: 'transform', scrollTrigger: { trigger: group, start: 'top 86%', once: true } });
      });
      gsap.utils.toArray<HTMLElement>('[data-pop]').forEach((el, i) => {
        gsap.from(el, { autoAlpha: 0, scale: 0.3, duration: 0.8, delay: (i % 6) * 0.06, ease: 'back.out(1.9)', scrollTrigger: { trigger: el.parentElement, start: 'top 80%', once: true } });
        gsap.to(el, { y: -12, duration: 3 + (i % 3) * 0.5, ease: 'sine.inOut', repeat: -1, yoyo: true }).totalTime(i * 0.9);
      });
      gsap.utils.toArray<HTMLElement>('[data-progress]').forEach((el) => {
        gsap.fromTo(el, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 } });
      });
      gsap.utils.toArray<HTMLElement>('[data-step]').forEach((el) => {
        ScrollTrigger.create({ trigger: el, start: 'top 62%', end: 'max', toggleClass: 'is-reached' });
      });
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: -Number(el.dataset.parallax) }, { yPercent: Number(el.dataset.parallax), ease: 'none', scrollTrigger: { trigger: el.parentElement, scrub: true } });
      });
    }, ref);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  return ref;
};

/**
 * The hero: tiles settle into the grid one by one while the headline rises word by word, the big logo folds itself together,
 * the object and its pills spring in and keep drifting, the headline's accent words catch a slow sweep of light, the picture breathes and parallaxes,
 * and on a mouse the layers lean toward the pointer.
 */
export const useHeroMotion = () => {
  const ref = useRef<HTMLElement>(null);
  const { reduced } = useMotion();

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduced) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: EASE } })
        .from('[data-tile]', { autoAlpha: 0, y: 46, scale: 0.97, duration: 1, stagger: 0.07, clearProps: 'transform' })
        .from('[data-word]', { yPercent: 118, duration: 0.9, stagger: 0.04 }, 0.12)
        .from('[data-thumb]', { autoAlpha: 0, x: -14, scale: 0.7, duration: 0.55, stagger: 0.05, ease: 'back.out(2)' }, 0.3)
        .from('[data-rise]', { autoAlpha: 0, y: 18, duration: 0.8, stagger: 0.09 }, 0.5)
        .from('[data-object]', { autoAlpha: 0, scale: 0.78, rotation: -8, duration: 1.3, ease: 'back.out(1.5)' }, 0.3)
        .from('[data-pill]', { autoAlpha: 0, scale: 0.35, duration: 0.65, stagger: 0.13, ease: 'back.out(2.4)' }, 0.85)
        // The logo's ribbon of tape is laid down fold by fold, each one starting where the last ended.
        .from('[data-big-mark] polygon', { scaleX: 0, transformOrigin: (i: number) => (i === 2 ? 'left center' : 'right center'), duration: 0.34, stagger: 0.17, ease: 'power2.inOut' }, 0.55);

      gsap.to('[data-object]', { y: -14, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.utils.toArray<HTMLElement>('[data-pill]').forEach((pill, i) => {
        gsap.to(pill, { y: i % 2 ? 9 : -9, duration: 2.3 + i * 0.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
      });
      gsap.fromTo('.bento-accent', { backgroundPosition: '100% 0' }, { backgroundPosition: '-100% 0', duration: 6, ease: 'none', repeat: -1 });
      gsap.fromTo('[data-hero-image]', { scale: 1.12 }, { scale: 1.2, duration: 15, ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to('[data-hero-image]', { yPercent: 5, ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true } });

      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const layers = gsap.utils.toArray<HTMLElement>('[data-depth]').map((el) => ({
        depth: Number(el.dataset.depth),
        x: gsap.quickTo(el, 'x', { duration: 0.9, ease: EASE }),
        y: gsap.quickTo(el, 'y', { duration: 0.9, ease: EASE }),
      }));
      const lean = (e: PointerEvent) => {
        const box = root.getBoundingClientRect();
        const across = (e.clientX - box.left) / box.width - 0.5;
        const down = (e.clientY - box.top) / box.height - 0.5;
        layers.forEach((layer) => {
          layer.x(across * layer.depth);
          layer.y(down * layer.depth);
        });
      };
      root.addEventListener('pointermove', lean);
      return () => root.removeEventListener('pointermove', lean);
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return ref;
};
