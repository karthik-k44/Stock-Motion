import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { activityService } from '../activity.service';
import { ListActivityQuerySchema } from '../activity.validators';

export const activityController = {
  List: async (req: Request, res: Response) => {
    res.json(await activityService.List(ScopeOf(req), ListActivityQuerySchema.parse(req.query)));
  },
};
