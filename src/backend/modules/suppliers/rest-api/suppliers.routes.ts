import { Router } from 'express';
import { RequireRole } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { MANAGEMENT_ROLES } from '@/backend/types/business';
import { suppliersController } from './suppliers.controller';

export const suppliersRoutes = Router();

suppliersRoutes.get('/', suppliersController.List);
suppliersRoutes.get('/:id', suppliersController.Get);
suppliersRoutes.post('/', RequireRole(...MANAGEMENT_ROLES), suppliersController.Create);
suppliersRoutes.put('/:id', RequireRole(...MANAGEMENT_ROLES), suppliersController.Update);
suppliersRoutes.delete('/:id', RequireRole(...MANAGEMENT_ROLES), suppliersController.Delete);
