import type { Request, Response } from 'express';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { itemsService } from '../items.service';
import {
  AdjustStockSchema,
  CreateItemSchema,
  ListItemsQuerySchema,
  RelocateSchema,
  SetComponentsSchema,
  SkuParamSchema,
  UpdateItemSchema,
} from '../items.validators';

const skuOf = (req: Request) => SkuParamSchema.parse(req.params).sku;

export const itemsController = {
  List: async (req: Request, res: Response) => {
    res.json(await itemsService.List(ScopeOf(req), ListItemsQuerySchema.parse(req.query)));
  },
  Get: async (req: Request, res: Response) => {
    res.json(await itemsService.Get(ScopeOf(req), skuOf(req)));
  },
  Create: async (req: Request, res: Response) => {
    res.status(201).json(await itemsService.Create(ScopeOf(req), CreateItemSchema.parse(req.body)));
  },
  Update: async (req: Request, res: Response) => {
    res.json(await itemsService.Update(ScopeOf(req), skuOf(req), UpdateItemSchema.parse(req.body)));
  },
  Archive: async (req: Request, res: Response) => {
    await itemsService.Archive(ScopeOf(req), skuOf(req));
    res.status(204).send();
  },
  SetComponents: async (req: Request, res: Response) => {
    res.json(await itemsService.SetComponents(ScopeOf(req), skuOf(req), SetComponentsSchema.parse(req.body)));
  },
  Adjust: async (req: Request, res: Response) => {
    res.json(await itemsService.Adjust(ScopeOf(req), skuOf(req), AdjustStockSchema.parse(req.body)));
  },
  Relocate: async (req: Request, res: Response) => {
    res.json(await itemsService.Relocate(ScopeOf(req), skuOf(req), RelocateSchema.parse(req.body)));
  },
};
