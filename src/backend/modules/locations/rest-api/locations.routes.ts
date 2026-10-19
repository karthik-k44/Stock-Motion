import { Router } from 'express';
import { locationsController } from './locations.controller';

export const locationsRoutes = Router();

locationsRoutes.get('/', locationsController.List);
