import { CONTACT } from '@/frontend/features/landing/lib/landing-content';
import { BillingIntervalTypeEnum, BillingProviderTypeEnum, type InvoiceResponseType } from '../types';
import { Inventories } from './billing-format';

/** Who the invoice is from. */
export const INVOICE_FROM = { name: 'StockMotion', email: CONTACT.email };

const METHOD_LABEL: Record<string, string> = { upi: 'UPI', card: 'Card', netbanking: 'Net banking', wallet: 'Wallet', emi: 'EMI', paylater: 'Pay later' };

/** How it was paid, in words. */
export const PaymentMethodText = (inv: InvoiceResponseType): string => {
  if (inv.provider === BillingProviderTypeEnum.MANUAL) return 'Not charged (switched on in development)';
  const method = inv.paymentMethod ? (METHOD_LABEL[inv.paymentMethod] ?? inv.paymentMethod) : 'Online';
  return `${method} via Razorpay`;
};

/** 10 Dec 2026 */
export const ShortDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const PeriodText = (inv: InvoiceResponseType) => `${ShortDate(inv.periodStart)} – ${ShortDate(inv.periodEnd)}`;

/** The one line on the invoice: "StockMotion Pro — 3 inventories, billed monthly" */
export const InvoiceLine = (inv: InvoiceResponseType) =>
  `StockMotion ${inv.plan.name} — ${Inventories(inv.quantity)}, billed ${inv.interval === BillingIntervalTypeEnum.YEARLY ? 'yearly' : 'monthly'}`;

/** INR 2,097.00 — with the currency code, for the PDF (its built-in font has no ₹ sign). */
export const MoneyWithCode = (minor: number, currency: string): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: 2 }).format(minor / 100).replace(/\s/g, ' ');

/** A safe file name: StockMotion-invoice-IVID100000.pdf */
export const InvoiceFileName = (inv: InvoiceResponseType) => `StockMotion-invoice-${inv.id}.pdf`;
