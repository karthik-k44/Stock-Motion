import type { AccountResponseType } from '@/backend/types/account';
import type { ScopeType } from '@/backend/types/business';

declare global {
  namespace Express {
    interface Request {
      /** The signed-in account (set by `RequireAuth`). */
      account?: AccountResponseType;
      /** The business being worked on and the caller's role in it (set by `RequireBusinessRole`). */
      scope?: ScopeType;
    }
  }
}

export {};
