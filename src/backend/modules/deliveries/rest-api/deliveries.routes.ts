import { Router } from 'express';
import { RequireRole } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { MANAGEMENT_ROLES } from '@/backend/types/business';
import { deliveriesController } from './deliveries.controller';

export const deliveriesRoutes = Router();

const managers = RequireRole(...MANAGEMENT_ROLES);

deliveriesRoutes.get('/', deliveriesController.List);
deliveriesRoutes.post('/', managers, deliveriesController.Create);
deliveriesRoutes.post('/reorder', managers, deliveriesController.Reorder);
deliveriesRoutes.get('/:number', deliveriesController.Get);
// Anyone on the team can mark a truck arrived and count it in.
deliveriesRoutes.post('/:number/status', deliveriesController.UpdateStatus);
deliveriesRoutes.post('/:number/receive', deliveriesController.Receive);
