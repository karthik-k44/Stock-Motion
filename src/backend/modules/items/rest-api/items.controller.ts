import type { Request, Response } from 'express';
import { ActorOf } from '@/backend/middleware/auth.middleware';
import { itemsService } from '../items.service';
import { AdjustStockSchema, ListItemsQuerySchema, RelocateSchema, SkuParamSchema } from '../items.validators';

export const itemsController = {
  List: async (req: Request, res: Response) => {
    res.json(await itemsService.List(ListItemsQuerySchema.parse(req.query)));
  },
  Get: async (req: Request, res: Response) => {
    const { sku } = SkuParamSchema.parse(req.params);
    res.json(await itemsService.Get(sku));
  },
  Adjust: async (req: Request, res: Response) => {
    const { sku } = SkuParamSchema.parse(req.params);
    res.json(await itemsService.Adjust(ActorOf(req), sku, AdjustStockSchema.parse(req.body)));
  },
  Relocate: async (req: Request, res: Response) => {
    const { sku } = SkuParamSchema.parse(req.params);
    res.json(await itemsService.Relocate(ActorOf(req), sku, RelocateSchema.parse(req.body)));
  },
};
