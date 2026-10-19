import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { locationsService } from '../locations.service';
import { CreateLocationSchema } from '../locations.validators';

export const locationsController = {
  List: async (req: Request, res: Response) => {
    res.json(await locationsService.List(ScopeOf(req)));
  },
  Create: async (req: Request, res: Response) => {
    res.status(201).json(await locationsService.Create(ScopeOf(req), CreateLocationSchema.parse(req.body)));
  },
};
