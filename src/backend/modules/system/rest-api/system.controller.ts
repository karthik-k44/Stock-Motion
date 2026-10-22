import type { Request, Response } from 'express';
import { systemService } from '../system.service';

export const systemController = {
  Health: async (_req: Request, res: Response) => {
    res.json(await systemService.Health());
  },
};
