import { MotionPreferenceTypeEnum } from '@/frontend/types';

/** User's animation preference, combined with the OS "reduce motion" setting. */
const KEY = 'stockmotion:motion';
const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

const readPref = (): MotionPreferenceTypeEnum => {
  try {
    const v = localStorage.getItem(KEY);
    if (v && v in MotionPreferenceTypeEnum) return v as MotionPreferenceTypeEnum;
  } catch {
    /* ignore */
  }
  return MotionPreferenceTypeEnum.SYSTEM;
};

type Snapshot = { preference: MotionPreferenceTypeEnum; reduced: boolean };

let preference = readPref();
const listeners = new Set<() => void>();

const compute = (): Snapshot => {
  const reduced =
    preference === MotionPreferenceTypeEnum.OFF || (preference === MotionPreferenceTypeEnum.SYSTEM && Boolean(query?.matches));
  document.documentElement.classList.toggle('reduce-motion', reduced);
  return { preference, reduced };
};

let snapshot: Snapshot = compute();

const emit = () => {
  snapshot = compute();
  listeners.forEach((l) => l());
};

query?.addEventListener('change', emit);

export const motionPreference = {
  Get: (): Snapshot => snapshot,
  Set: (next: MotionPreferenceTypeEnum) => {
    preference = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    emit();
  },
  Subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
