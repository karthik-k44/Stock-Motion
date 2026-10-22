import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { suppliersService } from '../suppliers.service';
import { ListSuppliersQuerySchema, SupplierIdParamSchema, SupplierSchema } from '../suppliers.validators';

const idOf = (req: Request) => SupplierIdParamSchema.parse(req.params).id;

export const suppliersController = {
  List: async (req: Request, res: Response) => {
    res.json(await suppliersService.List(ScopeOf(req), ListSuppliersQuerySchema.parse(req.query).search));
  },
  Get: async (req: Request, res: Response) => {
    res.json(await suppliersService.Get(ScopeOf(req), idOf(req)));
  },
  Create: async (req: Request, res: Response) => {
    res.status(201).json(await suppliersService.Create(ScopeOf(req), SupplierSchema.parse(req.body)));
  },
  Update: async (req: Request, res: Response) => {
    res.json(await suppliersService.Update(ScopeOf(req), idOf(req), SupplierSchema.parse(req.body)));
  },
  Delete: async (req: Request, res: Response) => {
    await suppliersService.Delete(ScopeOf(req), idOf(req));
    res.status(204).send();
  },
};
