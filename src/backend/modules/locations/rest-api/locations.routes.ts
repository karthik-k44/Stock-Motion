import { Router } from 'express';
import { RequireRole } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { MANAGEMENT_ROLES } from '@/backend/types/business';
import { locationsController } from './locations.controller';

export const locationsRoutes = Router();

locationsRoutes.get('/', locationsController.List);
locationsRoutes.post('/', RequireRole(...MANAGEMENT_ROLES), locationsController.Create);
