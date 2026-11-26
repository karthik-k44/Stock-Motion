import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { DaysLeft, PER } from '../lib/billing-format';
import { billingService } from '../services';
import { SubscriptionStatusTypeEnum } from '../types';

/** Trial days left at which the banner starts reminding. */
const REMIND_DAYS = 5;

/**
 * One line above every page when the plan needs attention: the business is read-only, a payment failed, or the trial is
 * nearly over. Staff see who can fix it; owners get the way to Billing.
 */
export const BillingBanner = () => {
  const business = businessesService.useBusiness();
  const billing = billingService.useGetBilling().data;

  let message: string | null = null;
  if (!business.access.writable) {
    message = business.access.ownerIsYou
      ? 'Your plan has ended, so this inventory is read-only. Nothing has been deleted.'
      : `${business.name} is read-only until its owner renews their plan.`;
  } else if (billing?.status === SubscriptionStatusTypeEnum.PAST_DUE) {
    message = 'Your last payment didn’t go through. Razorpay will try again.';
  } else if (billing?.hasAccess && (billing.status === SubscriptionStatusTypeEnum.TRIALING || !billing.autoRenews)) {
    // A trial, or a period paid for on its own: remind before it ends (a renewing plan needs no reminder).
    const days = DaysLeft(billing.currentPeriodEnd);
    const when = days === 0 ? 'ends today' : `ends in ${days} day${days === 1 ? '' : 's'}`;
    if (days !== null && days <= REMIND_DAYS) {
      message =
        billing.status === SubscriptionStatusTypeEnum.TRIALING
          ? `Your free trial ${when}.${billing.nextBill ? '' : ' Choose a plan to keep going.'}`
          : `Your ${billing.plan.name} ${PER[billing.interval]} ${when} — pay for the next one to keep going.`;
    }
  }
  if (!message) return null;

  const canFix = business.access.ownerIsYou || business.access.writable;
  return (
    <div role="status" className="note mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 sm:mx-6 sm:mt-6">
      <span>{message}</span>
      {canFix && (
        <Link to={business.access.writable ? paths.billing : paths.plans} className="font-semibold text-ink underline underline-offset-2">
          Choose a plan
        </Link>
      )}
    </div>
  );
};
