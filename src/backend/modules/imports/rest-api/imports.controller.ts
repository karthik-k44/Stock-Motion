import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { importsService } from '../imports.service';
import { ImportItemsSchema } from '../imports.validators';

export const importsController = {
  Preview: async (req: Request, res: Response) => {
    res.json(await importsService.Preview(ScopeOf(req), ImportItemsSchema.parse(req.body)));
  },
  Commit: async (req: Request, res: Response) => {
    res.status(201).json(await importsService.Commit(ScopeOf(req), ImportItemsSchema.parse(req.body)));
  },
};
