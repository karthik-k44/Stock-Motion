import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { dashboardService } from '../dashboard.service';

export const dashboardController = {
  Get: async (req: Request, res: Response) => {
    res.json(await dashboardService.Get(ScopeOf(req)));
  },
};
