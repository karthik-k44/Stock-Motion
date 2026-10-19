import { Router } from 'express';
import { RequireActor } from '@/backend/middleware/auth.middleware';
import { deliveriesController } from './deliveries.controller';

export const deliveriesRoutes = Router();

deliveriesRoutes.get('/', deliveriesController.List);
deliveriesRoutes.post('/', RequireActor, deliveriesController.Book);
deliveriesRoutes.get('/:id', deliveriesController.Get);
deliveriesRoutes.post('/:id/start-unloading', RequireActor, deliveriesController.StartUnloading);
deliveriesRoutes.post('/:id/receive', RequireActor, deliveriesController.Receive);
