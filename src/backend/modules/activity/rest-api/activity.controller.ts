import type { Request, Response } from 'express';
import { activityService } from '../activity.service';
import { ListActivityQuerySchema } from '../activity.validators';

export const activityController = {
  List: async (req: Request, res: Response) => {
    res.json(await activityService.List(ListActivityQuerySchema.parse(req.query)));
  },
};
