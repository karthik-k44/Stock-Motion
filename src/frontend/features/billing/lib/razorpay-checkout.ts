import { RazorpayModeTypeEnum, type RazorpayCheckoutResponseType, type RazorpayPaymentResponseType } from '../types';

type RazorpayInstanceType = { open: () => void; on: (event: 'payment.failed', handler: (r: { error?: { description?: string } }) => void) => void };

declare global {
  interface Window {
    Razorpay?: new (options: object) => RazorpayInstanceType;
  }
}

/** The ways to pay that the payment page offers; each opens Razorpay straight on that method. */
export const PaymentMethodEnum = {
  UPI: 'upi',
  CARD: 'card',
  NETBANKING: 'netbanking',
  WALLET: 'wallet',
} as const;
export type PaymentMethodEnum = (typeof PaymentMethodEnum)[keyof typeof PaymentMethodEnum];

/** What the payment page collected, passed on so Razorpay doesn't ask again. */
export type PayerType = { name: string; email: string; contact: string; method: PaymentMethodEnum };

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let loading: Promise<void> | null = null;

/** Razorpay's script, loaded on the first checkout only (never on other pages). */
const loadScript = (): Promise<void> =>
  (loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Couldn’t load Razorpay Checkout — check your connection and try again'));
    };
    document.head.appendChild(script);
  }));

/** Show only the method chosen on our page (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/configure-payment-methods). */
const onlyMethod = (method: PaymentMethodEnum) => ({
  display: {
    // UPI: the QR code, the UPI apps on a phone, and typing a UPI ID ("collect") where it's still allowed. NPCI ended
    // collect on 28 Feb 2026 except on mobile web and iOS (https://razorpay.com/docs/payments/payment-methods/upi/),
    // so Razorpay shows the UPI ID field on phones only, whatever is asked for here.
    blocks: { chosen: { name: 'Pay with', instruments: [method === PaymentMethodEnum.UPI ? { method, flows: ['collect', 'qr', 'intent'] } : { method }] } },
    sequence: ['block.chosen'],
    preferences: { show_default_blocks: false },
  },
});

/**
 * Open Razorpay Checkout for the order or subscription the server created, on the payment method chosen, with the
 * payer's details filled in. Card numbers, UPI PINs and bank logins are typed into Razorpay's window, never ours.
 * Resolves with Razorpay's signed proof of payment for the server to verify, or null when the customer closes it.
 */
export const OpenRazorpayCheckout = async (checkout: RazorpayCheckoutResponseType, payer: PayerType): Promise<RazorpayPaymentResponseType | null> => {
  await loadScript();
  if (!window.Razorpay) throw new Error('Razorpay Checkout didn’t start — try again');
  const Razorpay = window.Razorpay;
  return new Promise((resolve, reject) => {
    const checkoutForm = new Razorpay({
      key: checkout.keyId,
      ...(checkout.mode === RazorpayModeTypeEnum.ORDERS
        ? { order_id: checkout.orderId, amount: checkout.amountMinor, currency: checkout.currency }
        : { subscription_id: checkout.subscriptionId }),
      name: 'StockMotion',
      description: checkout.planName,
      prefill: { name: payer.name, email: payer.email, contact: payer.contact, method: payer.method },
      readonly: { email: true },
      config: onlyMethod(payer.method),
      theme: { color: '#e86b2c' },
      handler: (payment: RazorpayPaymentResponseType) => resolve(payment),
      modal: { ondismiss: () => resolve(null) },
    });
    checkoutForm.on('payment.failed', (r) => reject(new Error(r.error?.description ?? 'The payment didn’t go through')));
    checkoutForm.open();
  });
};
