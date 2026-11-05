import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router';
import { ErrorState } from '@/frontend/components/feedback';
import { paths } from '@/frontend/config/paths';
import { BusinessContext } from '@/frontend/features/businesses/lib/business-context';
import { businessesService } from '@/frontend/features/businesses/services';
import { FullPageStatus } from './FullPageStatus';

/**
 * Makes sure a business is selected and loaded before any business screen renders: the remembered
 * one if the account still belongs to it, else the first one, else onboarding.
 */
export const BusinessGate = ({ children }: { children: ReactNode }) => {
  const qc = useQueryClient();
  const selected = businessesService.useBusinessId();
  const mine = businessesService.useGetMyBusinesses();
  const current = businessesService.useGetCurrentBusiness();
  const valid = mine.data?.some((b) => b.id === selected);

  useEffect(() => {
    if (!mine.data?.length || valid) return;
    businessesService.SelectBusiness(qc, mine.data[0].id);
  }, [mine.data, valid, qc]);

  if (mine.isPending) return <FullPageStatus title="Loading your businesses…" />;
  if (mine.isError) return <ErrorState message={mine.error.message} onRetry={() => mine.refetch()} />;
  if (!mine.data.length) return <Navigate to={paths.onboarding} replace />;
  if (current.isError) return <ErrorState message={current.error.message} onRetry={() => current.refetch()} />;
  if (!valid || !current.data || current.data.id !== selected) return <FullPageStatus title="Opening your business…" />;
  // Keyed by business: switching remounts every screen, so no state leaks from one business to the next.
  return (
    <BusinessContext.Provider key={current.data.id} value={current.data}>
      {children}
    </BusinessContext.Provider>
  );
};
