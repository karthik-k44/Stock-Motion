import type { Request, Response } from 'express';
import { ActorOf } from '@/backend/middleware/auth.middleware';
import { ordersService } from '../orders.service';
import { ListOrdersQuerySchema, OrderIdParamSchema, OrderLineParamSchema, UpdateOrderSchema } from '../orders.validators';

const idOf = (req: Request) => OrderIdParamSchema.parse(req.params).id;

export const ordersController = {
  List: async (req: Request, res: Response) => {
    res.json(await ordersService.List(ListOrdersQuerySchema.parse(req.query)));
  },
  Get: async (req: Request, res: Response) => {
    res.json(await ordersService.Get(idOf(req)));
  },
  Update: async (req: Request, res: Response) => {
    res.json(await ordersService.Update(ActorOf(req), idOf(req), UpdateOrderSchema.parse(req.body)));
  },
  StartPicking: async (req: Request, res: Response) => {
    res.json(await ordersService.StartPicking(ActorOf(req), idOf(req)));
  },
  PickLine: async (req: Request, res: Response) => {
    const { id, sku } = OrderLineParamSchema.parse(req.params);
    res.json(await ordersService.PickLine(ActorOf(req), id, sku));
  },
  PickAll: async (req: Request, res: Response) => {
    res.json(await ordersService.PickAll(ActorOf(req), idOf(req)));
  },
  Pack: async (req: Request, res: Response) => {
    res.json(await ordersService.Pack(ActorOf(req), idOf(req)));
  },
  Ship: async (req: Request, res: Response) => {
    res.json(await ordersService.Ship(ActorOf(req), idOf(req)));
  },
};
