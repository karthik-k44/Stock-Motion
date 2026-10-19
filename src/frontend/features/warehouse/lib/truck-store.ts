import { useSyncExternalStore } from 'react';
import type { DeliveryResponseType } from '@/frontend/features/deliveries/types';

export const TruckPhaseTypeEnum = {
  IDLE: 'IDLE',
  APPROACHING: 'APPROACHING',
  PARKING: 'PARKING',
  UNLOADING: 'UNLOADING',
  RECEIVED: 'RECEIVED',
  DEPARTING: 'DEPARTING',
} as const;
export type TruckPhaseTypeEnum = (typeof TruckPhaseTypeEnum)[keyof typeof TruckPhaseTypeEnum];

export const TRUCK_PHASE_LABEL: Record<TruckPhaseTypeEnum, string> = {
  IDLE: 'Dock 1 free',
  APPROACHING: 'Approaching the dock',
  PARKING: 'Parking at Dock 1',
  UNLOADING: 'Unloading',
  RECEIVED: 'Stock received',
  DEPARTING: 'Departing',
};

export type TruckState = {
  phase: TruckPhaseTypeEnum;
  delivery: DeliveryResponseType | null;
  /** A replay only animates — it never changes stock. */
  replay: boolean;
  unloaded: number;
  /** Counted quantities to receive when unloading finishes. */
  quantities: { sku: string; received: number }[];
  runId: number;
  failed: boolean;
};

const IDLE: TruckState = { phase: 'IDLE', delivery: null, replay: false, unloaded: 0, quantities: [], runId: 0, failed: false };

let state: TruckState = IDLE;
const listeners = new Set<() => void>();
const set = (patch: Partial<TruckState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

/** Client-side state of the Dock 1 arrival sequence (driven by `TruckSequenceRunner`). */
export const truckStore = {
  Get: () => state,
  Subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  IsBusy: () => state.phase !== 'IDLE',
  /** Returns false when the dock is already busy. */
  Start(delivery: DeliveryResponseType, opts: { replay?: boolean; quantities?: TruckState['quantities'] } = {}): boolean {
    if (state.phase !== 'IDLE') return false;
    set({
      phase: 'APPROACHING', delivery, replay: Boolean(opts.replay), quantities: opts.quantities ?? [],
      unloaded: 0, runId: state.runId + 1, failed: false,
    });
    return true;
  },
  SetPhase(phase: TruckPhaseTypeEnum) {
    set(phase === 'IDLE' ? { ...IDLE, runId: state.runId } : { phase, ...(phase === 'UNLOADING' ? { unloaded: 0 } : {}) });
  },
  SetDelivery(delivery: DeliveryResponseType) {
    set({ delivery });
  },
  SetUnloaded(n: number) {
    set({ unloaded: n });
  },
  Fail() {
    set({ phase: 'DEPARTING', failed: true });
  },
};

export function useTruck(): TruckState {
  return useSyncExternalStore(truckStore.Subscribe, truckStore.Get);
}
