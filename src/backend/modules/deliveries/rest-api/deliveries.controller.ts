import type { Request, Response } from 'express';
import { ActorOf } from '@/backend/middleware/auth.middleware';
import { deliveriesService } from '../deliveries.service';
import { DeliveryIdParamSchema, ListDeliveriesQuerySchema, ReceiveDeliverySchema } from '../deliveries.validators';

const idOf = (req: Request) => DeliveryIdParamSchema.parse(req.params).id;

export const deliveriesController = {
  List: async (req: Request, res: Response) => {
    res.json(await deliveriesService.List(ListDeliveriesQuerySchema.parse(req.query)));
  },
  Get: async (req: Request, res: Response) => {
    res.json(await deliveriesService.Get(idOf(req)));
  },
  Book: async (req: Request, res: Response) => {
    res.status(201).json(await deliveriesService.Book(ActorOf(req)));
  },
  StartUnloading: async (req: Request, res: Response) => {
    res.json(await deliveriesService.StartUnloading(ActorOf(req), idOf(req)));
  },
  Receive: async (req: Request, res: Response) => {
    res.json(await deliveriesService.Receive(ActorOf(req), idOf(req), ReceiveDeliverySchema.parse(req.body ?? {})));
  },
};
