import { Router } from 'express';
import { RequireActor } from '@/backend/middleware/auth.middleware';
import { itemsController } from './items.controller';

export const itemsRoutes = Router();

itemsRoutes.get('/', itemsController.List);
itemsRoutes.get('/:sku', itemsController.Get);
itemsRoutes.post('/:sku/adjustments', RequireActor, itemsController.Adjust);
itemsRoutes.post('/:sku/relocate', RequireActor, itemsController.Relocate);
