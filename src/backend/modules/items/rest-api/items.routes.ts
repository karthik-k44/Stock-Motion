import { Router } from 'express';
import { RequireRole } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { MANAGEMENT_ROLES } from '@/backend/types/business';
import { itemsController } from './items.controller';

export const itemsRoutes = Router();

const managers = RequireRole(...MANAGEMENT_ROLES);

itemsRoutes.get('/', itemsController.List);
itemsRoutes.post('/', managers, itemsController.Create);
itemsRoutes.get('/:sku', itemsController.Get);
itemsRoutes.put('/:sku', managers, itemsController.Update);
itemsRoutes.delete('/:sku', managers, itemsController.Archive);
itemsRoutes.put('/:sku/components', managers, itemsController.SetComponents);
// Counting and moving stock is everyday floor work, so every team member can do it.
itemsRoutes.post('/:sku/adjustments', itemsController.Adjust);
itemsRoutes.post('/:sku/relocate', itemsController.Relocate);
