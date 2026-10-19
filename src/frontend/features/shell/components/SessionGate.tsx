import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { authService } from '@/frontend/features/auth/services';
import { OnSignedOut } from '@/frontend/services/api';
import { FullPageStatus } from './FullPageStatus';

/** Renders children only for a signed-in account; otherwise sends people to sign in and back. */
export function SessionGate({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const location = useLocation();
  const { data: account, isPending } = authService.useSession();

  // A refresh that fails mid-session (signed out on another device) ends this one too.
  useEffect(() => OnSignedOut(() => authService.EndSession(qc)), [qc]);

  if (isPending) return <FullPageStatus title="Opening StockMotion…" />;
  if (!account) {
    const next = location.pathname === paths.home ? '' : `?next=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={`${paths.login}${next}`} replace />;
  }
  return children;
}
