import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { VerifyAccessToken } from '@/backend/common/utils/jwt';
import { logger } from '@/backend/config/logger';
import { db } from '@/backend/db/client';
import { businessesRepository } from '@/backend/modules/businesses/businesses.repository';
import type { ActivityResponseType } from '@/backend/types/activity';
import type { DataChangedPayloadType, ResourceTypeEnum } from '@/backend/types/dashboard';

let io: Server | null = null;

const room = (businessId: string) => `business:${businessId}`;
/** Every socket of one account, so access can be taken away from all of its tabs at once. */
const accountRoom = (accountId: string) => `account:${accountId}`;

/** `business:join` requests one socket may make per window — each one is a membership lookup. */
const JOIN_LIMIT = { max: 20, windowMs: 60_000 };

export const AttachRealtime = (server: HttpServer): Server => {
  // destroyUpgrade:false — Vite's HMR websocket shares this HTTP server in development.
  io = new Server(server, { destroyUpgrade: false, serveClient: false });

  // Every socket carries the same access token as REST calls; no token, no connection.
  io.use((socket, next) => {
    try {
      const token = typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : '';
      socket.data.accountId = VerifyAccessToken(token);
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Realtime client connected ${socket.id}`);
    void socket.join(accountRoom(socket.data.accountId));
    let joins = { count: 0, resetAt: Date.now() + JOIN_LIMIT.windowMs };
    // A client watches one business at a time, and only one it is a member of.
    socket.on('business:join', async (businessId: unknown, ack?: (ok: boolean) => void) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      if (Date.now() > joins.resetAt) joins = { count: 0, resetAt: Date.now() + JOIN_LIMIT.windowMs };
      if (++joins.count > JOIN_LIMIT.max) return reply(false);
      if (typeof businessId !== 'string') return reply(false);
      if (!(await businessesRepository.FindMembership(db, businessId, socket.data.accountId))) return reply(false);
      for (const joined of socket.rooms) if (joined.startsWith('business:')) await socket.leave(joined);
      await socket.join(room(businessId));
      reply(true);
    });
  });
  return io;
};

/** Tell every client watching this business which resources changed (and what happened). */
export const BroadcastChange = (businessId: string, resources: ResourceTypeEnum[], activity: ActivityResponseType[] = []): void => {
  if (!io) return;
  const payload: DataChangedPayloadType = { businessId, resources, activity };
  io.to(room(businessId)).emit('data:changed', payload);
};

/** Stop an account's open tabs receiving a business's changes (they were removed, or left the team). */
export const RevokeRealtimeAccess = (businessId: string, accountId: string): void => {
  io?.in(accountRoom(accountId)).socketsLeave(room(businessId));
};

export const CloseRealtime = async (): Promise<void> => {
  if (!io) return;
  await io.close();
  io = null;
};
