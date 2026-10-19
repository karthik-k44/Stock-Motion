import { Router } from 'express';
import { activityController } from './activity.controller';

export const activityRoutes = Router();

activityRoutes.get('/', activityController.List);
