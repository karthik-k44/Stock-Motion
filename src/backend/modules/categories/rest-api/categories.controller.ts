import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { categoriesService } from '../categories.service';
import { CategoryCodeParamSchema, CreateCategorySchema } from '../categories.validators';

export const categoriesController = {
  List: async (req: Request, res: Response) => {
    res.json(await categoriesService.List(ScopeOf(req)));
  },
  Create: async (req: Request, res: Response) => {
    res.status(201).json(await categoriesService.Create(ScopeOf(req), CreateCategorySchema.parse(req.body)));
  },
  Delete: async (req: Request, res: Response) => {
    res.json(await categoriesService.Delete(ScopeOf(req), CategoryCodeParamSchema.parse(req.params).code));
  },
};
