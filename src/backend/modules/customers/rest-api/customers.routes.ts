import { Router } from 'express';
import { RequireRole } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { MANAGEMENT_ROLES } from '@/backend/types/business';
import { customersController } from './customers.controller';

export const customersRoutes = Router();

customersRoutes.get('/', customersController.List);
customersRoutes.get('/:id', customersController.Get);
// Any team member can add a customer at the counter; managers maintain the list.
customersRoutes.post('/', customersController.Create);
customersRoutes.put('/:id', customersController.Update);
customersRoutes.delete('/:id', RequireRole(...MANAGEMENT_ROLES), customersController.Delete);
