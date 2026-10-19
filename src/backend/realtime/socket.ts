import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { logger } from '@/backend/config/logger';
import type { ActivityResponseType } from '@/backend/types/activity';
import type { DataChangedPayloadType, ResourceTypeEnum } from '@/backend/types/dashboard';

let io: Server | null = null;

export function AttachRealtime(server: HttpServer): Server {
  // destroyUpgrade:false — Vite's HMR websocket shares this HTTP server in development.
  io = new Server(server, { destroyUpgrade: false, serveClient: false });
  io.on('connection', (socket) => {
    logger.debug(`Realtime client connected ${socket.id}`);
  });
  return io;
}

/** Tell every connected client which resources changed (and what happened), so they can refetch and animate. */
export function BroadcastChange(resources: ResourceTypeEnum[], activity: ActivityResponseType[] = []): void {
  if (!io) return;
  const payload: DataChangedPayloadType = { resources, activity };
  io.emit('data:changed', payload);
}

export async function CloseRealtime(): Promise<void> {
  if (!io) return;
  await io.close();
  io = null;
}
