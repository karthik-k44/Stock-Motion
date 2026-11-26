import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { PageHeader } from '@/frontend/components/layout';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { BillingFaq } from './components/BillingFaq';
import { PlanStatusPanel } from './components/PlanStatusPanel';
import { billingService } from './services';
import { CheckoutModeTypeEnum } from './types';

/** The signed-in account's plan and what to do next. Choosing and paying happen on the plans and payment pages. */
export const Billing = () => {
  useDocumentTitle('Billing');
  const billing = billingService.useGetBilling();

  return (
    <div className="page">
      <PageHeader title="Billing" description="Priced per inventory: one plan covers every inventory you own. Change or stop it any time — your data always stays." />
      {billing.isPending ? (
        <SkeletonRows rows={3} height={140} label="Loading your plan" />
      ) : billing.isError ? (
        <ErrorState message={billing.error.message} onRetry={() => billing.refetch()} />
      ) : (
        <>
          {billing.data.checkout === CheckoutModeTypeEnum.MANUAL && (
            <p className="note">Development mode: no Razorpay keys are set, so paying switches the plan at once, with no charge.</p>
          )}
          {billing.data.checkout === CheckoutModeTypeEnum.NONE && <p className="note">Payments aren’t set up on this server yet, so plans can’t be bought here.</p>}
          <PlanStatusPanel billing={billing.data} />
          <BillingFaq billing={billing.data} />
        </>
      )}
    </div>
  );
};
