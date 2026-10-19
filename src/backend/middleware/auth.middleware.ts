import type { NextFunction, Request, Response } from 'express';
import { Unauthorized } from '@/backend/common/errors';
import { usersService } from '@/backend/modules/users/users.service';
import type { UserResponseType } from '@/backend/types/user';

export const ACTOR_HEADER = 'x-user-id';

/**
 * Identifies which warehouse user is acting. This demo has no passwords: the
 * client sends the chosen user's id and it is validated against the users table.
 */
export async function RequireActor(req: Request, _res: Response, next: NextFunction) {
  const id = req.header(ACTOR_HEADER);
  if (!id) return next(Unauthorized());
  const user = await usersService.Find(id);
  if (!user) return next(Unauthorized(`Unknown user ${id}`));
  req.actor = user;
  next();
}

export function ActorOf(req: Request): UserResponseType {
  if (!req.actor) throw Unauthorized();
  return req.actor;
}
