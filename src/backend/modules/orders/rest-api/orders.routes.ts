import { Router } from 'express';
import { RequireActor } from '@/backend/middleware/auth.middleware';
import { ordersController } from './orders.controller';

export const ordersRoutes = Router();

ordersRoutes.get('/', ordersController.List);
ordersRoutes.get('/:id', ordersController.Get);
ordersRoutes.patch('/:id', RequireActor, ordersController.Update);
ordersRoutes.post('/:id/start-picking', RequireActor, ordersController.StartPicking);
ordersRoutes.post('/:id/lines/:sku/pick', RequireActor, ordersController.PickLine);
ordersRoutes.post('/:id/pick-all', RequireActor, ordersController.PickAll);
ordersRoutes.post('/:id/pack', RequireActor, ordersController.Pack);
ordersRoutes.post('/:id/ship', RequireActor, ordersController.Ship);
