import { Router } from 'express';
import { RequireRole } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { MANAGEMENT_ROLES } from '@/backend/types/business';
import { categoriesController } from './categories.controller';

export const categoriesRoutes = Router();

categoriesRoutes.get('/', categoriesController.List);
categoriesRoutes.post('/', RequireRole(...MANAGEMENT_ROLES), categoriesController.Create);
categoriesRoutes.delete('/:code', RequireRole(...MANAGEMENT_ROLES), categoriesController.Delete);
