import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import type { ApiError } from '@/frontend/services/api-error';
import { ToApiError } from '@/frontend/services/api-error';
import { Get, Post } from '@/frontend/services/request';
import { OpenRazorpayCheckout, type PayerType } from '../lib/razorpay-checkout';
import { BillingProviderTypeEnum, type BillingResponseType, type CheckoutResponseType, type InvoiceResponseType, type PlanChoiceType } from '../types';

const billingKeys = {
  all: ['billing'] as const,
  invoices: () => [...billingKeys.all, 'invoices'] as const,
  invoice: (id: string) => [...billingKeys.all, 'invoices', id] as const,
};

/** The signed-in account's plan. */
const useGetBilling = () => useQuery({ queryKey: billingKeys.all, queryFn: (): Promise<BillingResponseType> => Get('/billing') });

/** A plan change can make businesses writable again (or not), so their cached access is stale too; a payment adds an invoice. */
const useApplyBilling = () => {
  const qc = useQueryClient();
  return async (billing: BillingResponseType) => {
    qc.setQueryData(billingKeys.all, billing);
    await Promise.all([
      qc.invalidateQueries({ queryKey: billingKeys.invoices() }),
      qc.invalidateQueries({ queryKey: ['business'] }),
      qc.invalidateQueries({ queryKey: ['businesses'] }),
    ]);
  };
};

/** The account's invoices, newest first. */
const useGetInvoices = () => useQuery({ queryKey: billingKeys.invoices(), queryFn: (): Promise<InvoiceResponseType[]> => Get('/billing/invoices') });

const useGetInvoice = (id: string | undefined) =>
  useQuery({
    queryKey: billingKeys.invoice(id ?? ''),
    queryFn: (): Promise<InvoiceResponseType> => Get(`/billing/invoices/${encodeURIComponent(id ?? '')}`),
    enabled: Boolean(id),
    retry: false,
  });

/** Skip paying for now: the free trial covers the inventories chosen, and the next bill is for that plan. */
const useChooseTrialPlan = () => {
  const apply = useApplyBilling();
  return useMutation<BillingResponseType, ApiError, PlanChoiceType>({
    mutationFn: (choice) => Post('/billing/trial', choice),
    onSuccess: apply,
    onError: (err) => ToastManager.Error('Couldn’t start the trial', err.message),
  });
};

/**
 * Pay for a plan. With Razorpay: the server creates the order (or subscription), Checkout opens on the method chosen
 * and takes the payment, the server verifies Razorpay's signature. In manual mode (development) the server switches the
 * plan at once. Resolves null when the customer closes Checkout without paying.
 */
const useChoosePlan = () => {
  const apply = useApplyBilling();
  return useMutation<BillingResponseType | null, ApiError, { choice: PlanChoiceType; payer: PayerType }>({
    mutationFn: async ({ choice, payer }) => {
      const checkout: CheckoutResponseType = await Post('/billing/checkout', choice);
      if (checkout.provider === BillingProviderTypeEnum.MANUAL) return checkout.billing;
      let payment;
      try {
        payment = await OpenRazorpayCheckout(checkout, payer);
      } catch (err) {
        throw ToApiError(err);
      }
      return payment ? Post<BillingResponseType>('/billing/checkout/verify', payment) : null;
    },
    // The payment page shows the confirmation itself.
    onSuccess: async (billing) => {
      if (billing) await apply(billing);
    },
  });
};

/** Stop renewing; the paid period keeps working. */
const useCancelPlan = () => {
  const apply = useApplyBilling();
  return useMutation<BillingResponseType, ApiError, void>({
    mutationFn: () => Post('/billing/cancel'),
    onSuccess: async (billing) => {
      await apply(billing);
      ToastManager.Success('Plan cancelled', 'It keeps working until the end of the period you’ve paid for');
    },
    onError: (err) => ToastManager.Error('Couldn’t cancel', err.message),
  });
};

/** Ask Razorpay for the latest (renewals and failed charges; on the deployed site webhooks do this automatically). */
const useSyncBilling = () => {
  const apply = useApplyBilling();
  return useMutation<BillingResponseType, ApiError, void>({
    mutationFn: () => Post('/billing/sync'),
    onSuccess: apply,
    onError: (err) => ToastManager.Error('Couldn’t refresh from Razorpay', err.message),
  });
};

export const billingService = { billingKeys, useGetBilling, useGetInvoices, useGetInvoice, useChooseTrialPlan, useChoosePlan, useCancelPlan, useSyncBilling };
