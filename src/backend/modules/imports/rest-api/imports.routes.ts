import { Router } from 'express';
import { RequireRole } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { MANAGEMENT_ROLES } from '@/backend/types/business';
import { importsController } from './imports.controller';

export const importsRoutes = Router();

importsRoutes.use(RequireRole(...MANAGEMENT_ROLES));
importsRoutes.post('/items/preview', importsController.Preview);
importsRoutes.post('/items', importsController.Commit);
