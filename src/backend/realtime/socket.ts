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

export function AttachRealtime(server: HttpServer): Server {
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
    // A client watches one business at a time, and only one it is a member of.
    socket.on('business:join', async (businessId: unknown, ack?: (ok: boolean) => void) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      if (typeof businessId !== 'string') return reply(false);
      if (!(await businessesRepository.FindMembership(db, businessId, socket.data.accountId))) return reply(false);
      for (const joined of socket.rooms) if (joined.startsWith('business:')) await socket.leave(joined);
      await socket.join(room(businessId));
      reply(true);
    });
  });
  return io;
}

/** Tell every client watching this business which resources changed (and what happened). */
export function BroadcastChange(businessId: string, resources: ResourceTypeEnum[], activity: ActivityResponseType[] = []): void {
  if (!io) return;
  const payload: DataChangedPayloadType = { businessId, resources, activity };
  io.to(room(businessId)).emit('data:changed', payload);
}

export async function CloseRealtime(): Promise<void> {
  if (!io) return;
  await io.close();
  io = null;
}
