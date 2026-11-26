import { z } from 'zod';
import { BillingIntervalTypeEnum } from '@/backend/types/billing';
import { MAX_INVENTORIES, PURCHASABLE } from './plans';

/** A plan, how often it's paid for and for how many inventories: for a checkout, or for after the trial. */
export const PlanChoiceSchema = z.object({
  plan: z.enum(PURCHASABLE, { errorMap: () => ({ message: 'Choose Starter or Pro' }) }),
  interval: z.nativeEnum(BillingIntervalTypeEnum, { errorMap: () => ({ message: 'Choose monthly or yearly' }) }),
  quantity: z.coerce
    .number()
    .int('Choose a whole number of inventories')
    .min(1, 'Choose at least one inventory')
    .max(MAX_INVENTORIES, `Up to ${MAX_INVENTORIES} inventories — talk to us about Scale for more`),
});
export type PlanChoiceInput = z.infer<typeof PlanChoiceSchema>;

export const InvoiceIdParamSchema = z.object({ invoiceId: z.string().min(1).max(32) });

const RazorpayId = z.string().min(1).max(64);
const Signature = z.string().regex(/^[0-9a-f]{64}$/, 'Invalid signature');

/** What Razorpay Checkout hands the browser after payment: for a one-month order, or for a subscription. */
export const VerifyCheckoutSchema = z.union([
  z
    .object({ razorpay_payment_id: RazorpayId, razorpay_order_id: RazorpayId, razorpay_signature: Signature })
    .transform((v) => ({ paymentId: v.razorpay_payment_id, orderId: v.razorpay_order_id, signature: v.razorpay_signature })),
  z
    .object({ razorpay_payment_id: RazorpayId, razorpay_subscription_id: RazorpayId, razorpay_signature: Signature })
    .transform((v) => ({ paymentId: v.razorpay_payment_id, subscriptionId: v.razorpay_subscription_id, signature: v.razorpay_signature })),
]);
export type VerifyCheckoutInput = z.infer<typeof VerifyCheckoutSchema>;
