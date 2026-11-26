import { Router } from 'express';
import { RequireAuth } from '@/backend/middleware/auth.middleware';
import { BaseRoleTypeEnum, MANAGEMENT_ROLES } from '@/backend/types/business';
import { businessesController } from './businesses.controller';
import { RequireRole } from './businesses.middleware';

/** `/api/businesses` — the caller's businesses, and creating one. */
export const businessesRoutes = Router();

businessesRoutes.get('/', RequireAuth, businessesController.ListMine);
businessesRoutes.post('/', RequireAuth, businessesController.Create);
businessesRoutes.post('/batch', RequireAuth, businessesController.CreateMany);

/** `/api/businesses/:businessId` — mounted behind RequireAuth + RequireBusinessRole() in app.ts. */
export const businessRoutes = Router();

businessRoutes.get('/', businessesController.Get);
businessRoutes.patch('/', RequireRole(...MANAGEMENT_ROLES), businessesController.Update);
businessRoutes.post('/reset', RequireRole(BaseRoleTypeEnum.OWNER), businessesController.Reset);
businessRoutes.get('/members', businessesController.ListMembers);
businessRoutes.patch('/members/:accountId', RequireRole(BaseRoleTypeEnum.OWNER), businessesController.UpdateMember);
businessRoutes.delete('/members/:accountId', businessesController.RemoveMember);
