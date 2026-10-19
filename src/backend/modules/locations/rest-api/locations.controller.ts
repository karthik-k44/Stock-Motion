import type { Request, Response } from 'express';
import { locationsService } from '../locations.service';

export const locationsController = {
  List: async (_req: Request, res: Response) => {
    res.json(await locationsService.List());
  },
};
