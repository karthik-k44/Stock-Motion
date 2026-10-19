import { Router } from 'express';
import { systemController } from './system.controller';

export const systemRoutes = Router();

systemRoutes.get('/health', systemController.Health);
