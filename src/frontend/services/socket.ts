import { io, type Socket } from 'socket.io-client';

/** Mirrors the backend `DataChangedPayloadType` (types are intentionally duplicated). */
export type DataChangedEvent = {
  resources: string[];
  activity: {
    id: number;
    at: string;
    kind: string;
    userId: string;
    message: string;
    refType: string | null;
    refId: string | null;
    meta: { assignee?: string; skus?: string[]; locations?: string[]; from?: string; to?: string };
  }[];
};

let socket: Socket | null = null;
const listeners = new Set<(e: DataChangedEvent) => void>();
const statusListeners = new Set<(connected: boolean) => void>();

export const realtime = {
  Connect() {
    if (socket) return;
    socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socket.on('data:changed', (e: DataChangedEvent) => listeners.forEach((l) => l(e)));
    socket.on('connect', () => statusListeners.forEach((l) => l(true)));
    socket.on('disconnect', () => statusListeners.forEach((l) => l(false)));
  },
  OnDataChanged(fn: (e: DataChangedEvent) => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  OnStatus(fn: (connected: boolean) => void) {
    statusListeners.add(fn);
    return () => {
      statusListeners.delete(fn);
    };
  },
  IsConnected: () => Boolean(socket?.connected),
};
