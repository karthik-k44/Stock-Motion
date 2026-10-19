/**
 * Crew simulation: every warehouse user is a character on the floor with a
 * queue of steps. Positions advance each animation frame and are written
 * straight to the DOM by `CrewMember`; discrete changes (task text, carrying,
 * walking, facing) notify React subscribers.
 */
import type { UserResponseType, UserRoleTypeEnum } from '@/frontend/features/users/types';

export type CrewStep =
  | { k: 'walk'; x: number }
  | { k: 'wait'; ms: number }
  | { k: 'say'; text: string | null }
  | { k: 'carry'; on: boolean };

export type CrewWorker = {
  id: string;
  role: UserRoleTypeEnum;
  x: number;
  lane: number;
  dir: 1 | -1;
  moving: boolean;
  carrying: boolean;
  task: string | null;
  speed: number;
  zone: [number, number];
  queue: CrewStep[];
  waitLeft: number;
  idleIn: number;
};

const START: Record<UserRoleTypeEnum, Pick<CrewWorker, 'x' | 'lane' | 'zone' | 'speed'>> = {
  INVENTORY_MANAGER: { x: 1240, lane: 2, zone: [1150, 3300], speed: 120 },
  PICKER: { x: 1690, lane: 1, zone: [1150, 3300], speed: 135 },
  FORKLIFT_OPERATOR: { x: 930, lane: 0, zone: [780, 1640], speed: 190 },
  RECEIVING_LEAD: { x: 790, lane: 2, zone: [720, 1080], speed: 125 },
  PACKER: { x: 3520, lane: 1, zone: [3380, 3660], speed: 115 },
};

const workers: CrewWorker[] = [];
let snapshot: readonly CrewWorker[] = [];
let reduced = false;
let raf = 0;
let last = 0;
const listeners = new Set<() => void>();
const frameListeners = new Set<() => void>();

function changed() {
  snapshot = workers.map((w) => ({ ...w }));
  listeners.forEach((l) => l());
}

function stepWorker(w: CrewWorker, dt: number): boolean {
  let discrete = false;
  let moved = false;
  for (let budget = 8; budget > 0; budget--) {
    const step = w.queue[0];
    if (!step) {
      if (reduced) break;
      w.idleIn -= dt * 1000;
      if (w.idleIn > 0) break;
      const [a, b] = w.zone;
      w.queue.push({ k: 'walk', x: a + Math.random() * (b - a) });
      w.idleIn = 5000 + Math.random() * 8000;
      continue;
    }
    if (step.k === 'say' || step.k === 'carry') {
      if (step.k === 'say') w.task = step.text;
      else w.carrying = step.on;
      w.queue.shift();
      discrete = true;
      continue;
    }
    if (step.k === 'wait') {
      if (w.waitLeft <= 0) w.waitLeft = reduced ? Math.min(step.ms, 900) : step.ms;
      w.waitLeft -= dt * 1000;
      if (w.waitLeft > 0) break;
      w.waitLeft = 0;
      w.queue.shift();
      continue;
    }
    const dx = step.x - w.x;
    const dir: 1 | -1 = dx >= 0 ? 1 : -1;
    if (Math.abs(dx) > 0.5 && dir !== w.dir) {
      w.dir = dir;
      discrete = true;
    }
    const travel = w.speed * dt;
    if (reduced || Math.abs(dx) <= travel) {
      w.x = step.x;
      w.queue.shift();
      if (reduced) continue;
      moved = Math.abs(dx) > 0.5;
      break;
    }
    w.x += dir * travel;
    moved = true;
    break;
  }
  if (moved !== w.moving) {
    w.moving = moved;
    discrete = true;
  }
  return discrete;
}

function loop(t: number) {
  const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
  last = t;
  let discrete = false;
  for (const w of workers) discrete = stepWorker(w, dt) || discrete;
  if (discrete) changed();
  frameListeners.forEach((l) => l());
  raf = requestAnimationFrame(loop);
}

export const crewStore = {
  /** Create a character for each user (keeps existing ones in place). */
  EnsureWorkers(users: UserResponseType[]) {
    const known = new Set(workers.map((w) => w.id));
    users.forEach((u, i) => {
      if (known.has(u.id)) return;
      workers.push({
        id: u.id, role: u.role, dir: 1, moving: false, carrying: false, task: null,
        queue: [], waitLeft: 0, idleIn: 1500 + i * 1300, ...START[u.role],
      });
    });
    changed();
    if (!raf) raf = requestAnimationFrame(loop);
  },
  SetReduced(next: boolean) {
    reduced = next;
  },
  /** Replace a character's queue with a routine; `holdMs` delays idle wandering afterwards. */
  Run(id: string, steps: CrewStep[], holdMs = 7000) {
    const w = workers.find((x) => x.id === id);
    if (!w) return;
    w.queue = [...steps];
    w.waitLeft = 0;
    w.idleIn = holdMs;
    changed();
  },
  Then(id: string, steps: CrewStep[]) {
    workers.find((x) => x.id === id)?.queue.push(...steps);
  },
  Position: (id: string) => workers.find((w) => w.id === id)?.x ?? 0,
  Get: () => snapshot,
  Subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  OnFrame(fn: () => void) {
    frameListeners.add(fn);
    return () => {
      frameListeners.delete(fn);
    };
  },
};
