import { Router } from 'express';
import { env } from '@/backend/config/env';
import { RequireAuth } from '@/backend/middleware/auth.middleware';
import { RateLimitWrites } from '@/backend/middleware/rate-limit.middleware';
import { RequireRole } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { MANAGEMENT_ROLES } from '@/backend/types/business';
import { invitesController } from './invites.controller';

/** `/api/invites/:token` — public preview, then accept (signed in) or sign up from the link. */
export const publicInvitesRoutes = Router();

const throttle = RateLimitWrites({ windowMs: 15 * 60_000, max: env.NODE_ENV === 'test' ? Number.MAX_SAFE_INTEGER : 30 });

publicInvitesRoutes.get('/:token', invitesController.Preview);
publicInvitesRoutes.post('/:token/accept', throttle, RequireAuth, invitesController.Accept);
publicInvitesRoutes.post('/:token/register', throttle, invitesController.Register);

/** `/api/businesses/:businessId/invites` — managers create and revoke invite links. */
export const invitesRoutes = Router();

invitesRoutes.use(RequireRole(...MANAGEMENT_ROLES));
invitesRoutes.get('/', invitesController.List);
invitesRoutes.post('/', invitesController.Create);
invitesRoutes.delete('/:inviteId', invitesController.Revoke);
