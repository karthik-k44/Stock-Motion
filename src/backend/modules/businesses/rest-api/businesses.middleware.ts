import type { NextFunction, Request, Response } from 'express';
import { Forbidden, NotFound, Unauthorized } from '@/backend/common/errors';
import { templatesService } from '@/backend/modules/templates/templates.service';
import type { ScopeType } from '@/backend/types/business';
import { businessesService } from '../businesses.service';

/**
 * Gate a `/businesses/:businessId/...` route to members of that business (optionally with one of
 * `roles`) and resolve `req.scope`. Non-members get 404 so business ids can't be probed.
 * Always run after RequireAuth.
 */
export function RequireBusinessRole(...roles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.account) return next(Unauthorized());
    const businessId = req.params.businessId;
    if (typeof businessId !== 'string') return next(NotFound('Business', ''));
    const membership = await businessesService.FindMembership(businessId, req.account.id);
    if (!membership) return next(NotFound('Business', businessId));
    if (roles.length && !roles.includes(membership.role)) return next(Forbidden(roleMessage(roles)));
    req.scope = {
      businessId,
      template: templatesService.Get(membership.type),
      actor: { id: req.account.id, name: req.account.name, role: membership.role },
    };
    next();
  };
}

/** Narrow an already-scoped route to some roles, e.g. RequireRole(...MANAGEMENT_ROLES). */
export function RequireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.scope) return next(Unauthorized());
    if (!roles.includes(req.scope.actor.role)) return next(Forbidden(roleMessage(roles)));
    next();
  };
}

const roleMessage = (roles: string[]) =>
  `Only ${roles.map((r) => `${r.toLowerCase().replaceAll('_', ' ')}s`).join(' and ')} can do this`;

export function ScopeOf(req: Request): ScopeType {
  if (!req.scope) throw Unauthorized();
  return req.scope;
}
