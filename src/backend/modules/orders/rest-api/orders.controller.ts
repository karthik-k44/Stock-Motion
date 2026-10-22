import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { ordersService } from '../orders.service';
import {
  AdvanceOrderSchema,
  ConsumeSchema,
  CreateOrderSchema,
  ListOrdersQuerySchema,
  OrderNumberParamSchema,
  SetLinesSchema,
  UpdateOrderSchema,
} from '../orders.validators';

const numberOf = (req: Request) => OrderNumberParamSchema.parse(req.params).number;

export const ordersController = {
  List: async (req: Request, res: Response) => {
    res.json(await ordersService.List(ScopeOf(req), ListOrdersQuerySchema.parse(req.query)));
  },
  Get: async (req: Request, res: Response) => {
    res.json(await ordersService.Get(ScopeOf(req), numberOf(req)));
  },
  Create: async (req: Request, res: Response) => {
    res.status(201).json(await ordersService.Create(ScopeOf(req), CreateOrderSchema.parse(req.body)));
  },
  Update: async (req: Request, res: Response) => {
    res.json(await ordersService.Update(ScopeOf(req), numberOf(req), UpdateOrderSchema.parse(req.body)));
  },
  SetLines: async (req: Request, res: Response) => {
    res.json(await ordersService.SetLines(ScopeOf(req), numberOf(req), SetLinesSchema.parse(req.body)));
  },
  Advance: async (req: Request, res: Response) => {
    res.json(await ordersService.Advance(ScopeOf(req), numberOf(req), AdvanceOrderSchema.parse(req.body)));
  },
  Consume: async (req: Request, res: Response) => {
    res.json(await ordersService.Consume(ScopeOf(req), numberOf(req), ConsumeSchema.parse(req.body ?? {})));
  },
  Cancel: async (req: Request, res: Response) => {
    res.json(await ordersService.Cancel(ScopeOf(req), numberOf(req)));
  },
};
