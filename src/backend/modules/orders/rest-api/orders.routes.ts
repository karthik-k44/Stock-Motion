import { Router } from 'express';
import { RequireRole } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { MANAGEMENT_ROLES } from '@/backend/types/business';
import { ordersController } from './orders.controller';

export const ordersRoutes = Router();

ordersRoutes.get('/', ordersController.List);
ordersRoutes.post('/', ordersController.Create);
ordersRoutes.get('/:number', ordersController.Get);
ordersRoutes.patch('/:number', ordersController.Update);
ordersRoutes.put('/:number/lines', ordersController.SetLines);
ordersRoutes.post('/:number/advance', ordersController.Advance);
ordersRoutes.post('/:number/consume', ordersController.Consume);
ordersRoutes.post('/:number/cancel', RequireRole(...MANAGEMENT_ROLES), ordersController.Cancel);
