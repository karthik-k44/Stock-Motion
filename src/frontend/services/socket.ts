import { io, type Socket } from 'socket.io-client';
import { RefreshAccessToken } from './api';
import { sessionState } from './session-state';
import { tokenStore } from './token-store';

/** Mirrors the backend `DataChangedPayloadType` (types are intentionally duplicated). */
export type DataChangedEvent = {
  businessId: string;
  resources: string[];
  activity: {
    id: number;
    at: string;
    kind: string;
    accountId: string | null;
    actorName: string | null;
    message: string;
    refType: string | null;
    refId: string | null;
    meta: { assignee?: string | null; skus?: string[]; locations?: string[]; from?: string; to?: string; status?: string };
  }[];
};

/** Mirrors the backend `SESSION_EXPIRED_EVENT`: the server is closing this socket because its access token expired. */
const SESSION_EXPIRED_EVENT = 'session:expired';

let socket: Socket | null = null;
const listeners = new Set<(e: DataChangedEvent) => void>();
const statusListeners = new Set<(connected: boolean) => void>();
const emitStatus = (on: boolean) => statusListeners.forEach((l) => l(on));

const join = () => {
  const id = sessionState.GetBusinessId();
  if (socket?.connected && id) socket.emit('business:join', id, (ok: boolean) => emitStatus(ok));
};

sessionState.Subscribe(join);

export const realtime = {
  /** Connects with the current access token; re-joins the current business on every (re)connect. */
  Connect: () => {
    if (socket) return;
    // WebSocket only: long-polling needs every request to reach the same server, which serverless hosts don't promise.
    socket = io({ path: '/api/socket.io', transports: ['websocket'], auth: (cb) => cb({ token: tokenStore.Get() ?? '' }) });
    socket.on('data:changed', (e: DataChangedEvent) => {
      if (e.businessId === sessionState.GetBusinessId()) listeners.forEach((l) => l(e));
    });
    socket.on('connect', join);
    socket.on('disconnect', () => emitStatus(false));
    // socket.io doesn't reconnect by itself after the server closes a socket: renew the token, then reconnect.
    socket.on(SESSION_EXPIRED_EVENT, async () => {
      await RefreshAccessToken().catch(() => undefined);
      socket?.connect();
    });
    socket.on('connect_error', async (err) => {
      emitStatus(false);
      // The access token expired between reconnects: renew it, then let socket.io retry.
      if (err.message === 'UNAUTHORIZED') {
        await RefreshAccessToken().catch(() => undefined);
        socket?.connect();
      }
    });
  },
  Disconnect: () => {
    socket?.close();
    socket = null;
    emitStatus(false);
  },
  OnDataChanged: (fn: (e: DataChangedEvent) => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  OnStatus: (fn: (connected: boolean) => void) => {
    statusListeners.add(fn);
    return () => {
      statusListeners.delete(fn);
    };
  },
  IsConnected: () => Boolean(socket?.connected),
};
