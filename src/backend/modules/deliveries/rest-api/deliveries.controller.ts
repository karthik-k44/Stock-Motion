import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { deliveriesService } from '../deliveries.service';
import {
  CreateDeliverySchema,
  DeliveryNumberParamSchema,
  ListDeliveriesQuerySchema,
  ReceiveDeliverySchema,
  ReorderSchema,
  UpdateDeliveryStatusSchema,
} from '../deliveries.validators';

const numberOf = (req: Request) => DeliveryNumberParamSchema.parse(req.params).number;

export const deliveriesController = {
  List: async (req: Request, res: Response) => {
    res.json(await deliveriesService.List(ScopeOf(req), ListDeliveriesQuerySchema.parse(req.query)));
  },
  Get: async (req: Request, res: Response) => {
    res.json(await deliveriesService.Get(ScopeOf(req), numberOf(req)));
  },
  Create: async (req: Request, res: Response) => {
    res.status(201).json(await deliveriesService.Create(ScopeOf(req), CreateDeliverySchema.parse(req.body)));
  },
  Reorder: async (req: Request, res: Response) => {
    res.status(201).json(await deliveriesService.Reorder(ScopeOf(req), ReorderSchema.parse(req.body ?? {})));
  },
  UpdateStatus: async (req: Request, res: Response) => {
    res.json(await deliveriesService.UpdateStatus(ScopeOf(req), numberOf(req), UpdateDeliveryStatusSchema.parse(req.body)));
  },
  Receive: async (req: Request, res: Response) => {
    res.json(await deliveriesService.Receive(ScopeOf(req), numberOf(req), ReceiveDeliverySchema.parse(req.body ?? {})));
  },
};
