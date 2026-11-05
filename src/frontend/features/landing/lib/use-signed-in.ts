import { authService } from '@/frontend/features/auth/services';

/** Marketing pages swap "Log in / Get started" for "Open StockMotion" when there's a session (cached by React Query). */
export const useSignedIn = () => Boolean(authService.useGetSession().data);
