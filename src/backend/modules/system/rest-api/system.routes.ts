import { Router, type Request, type Response } from 'express';
import { RequireActor } from '@/backend/middleware/auth.middleware';
import { systemService } from '../system.service';

export const systemRoutes = Router();

systemRoutes.get('/health', async (_req: Request, res: Response) => {
  res.json(await systemService.Health());
});
systemRoutes.post('/reset', RequireActor, async (_req: Request, res: Response) => {
  res.json(await systemService.Reset());
});
