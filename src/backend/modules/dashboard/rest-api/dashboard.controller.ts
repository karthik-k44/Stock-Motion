import type { Request, Response } from 'express';
import { dashboardService } from '../dashboard.service';

export const dashboardController = {
  Get: async (_req: Request, res: Response) => {
    res.json(await dashboardService.Get());
  },
};
