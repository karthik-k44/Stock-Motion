import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { customersService } from '../customers.service';
import { CustomerIdParamSchema, CustomerSchema, ListCustomersQuerySchema } from '../customers.validators';

const idOf = (req: Request) => CustomerIdParamSchema.parse(req.params).id;

export const customersController = {
  List: async (req: Request, res: Response) => {
    res.json(await customersService.List(ScopeOf(req), ListCustomersQuerySchema.parse(req.query).search));
  },
  Get: async (req: Request, res: Response) => {
    res.json(await customersService.Get(ScopeOf(req), idOf(req)));
  },
  Create: async (req: Request, res: Response) => {
    res.status(201).json(await customersService.Create(ScopeOf(req), CustomerSchema.parse(req.body)));
  },
  Update: async (req: Request, res: Response) => {
    res.json(await customersService.Update(ScopeOf(req), idOf(req), CustomerSchema.parse(req.body)));
  },
  Delete: async (req: Request, res: Response) => {
    await customersService.Delete(ScopeOf(req), idOf(req));
    res.status(204).send();
  },
};
