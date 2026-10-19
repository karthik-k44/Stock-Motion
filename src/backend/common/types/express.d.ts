import type { UserResponseType } from '@/backend/types/user';

declare global {
  namespace Express {
    interface Request {
      /** The warehouse user performing the request (set by `RequireActor`). */
      actor?: UserResponseType;
    }
  }
}

export {};
