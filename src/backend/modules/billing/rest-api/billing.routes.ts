import express, { Router } from 'express';
import { RequireAuth } from '@/backend/middleware/auth.middleware';
import { billingController } from './billing.controller';

/** `/api/billing` — the signed-in account's plan. */
export const billingRoutes = Router();

billingRoutes.get('/', RequireAuth, billingController.Get);
billingRoutes.post('/trial', RequireAuth, billingController.ChooseTrialPlan);
billingRoutes.post('/checkout', RequireAuth, billingController.Checkout);
billingRoutes.post('/checkout/verify', RequireAuth, billingController.VerifyCheckout);
billingRoutes.post('/cancel', RequireAuth, billingController.Cancel);
billingRoutes.get('/invoices', RequireAuth, billingController.ListInvoices);
billingRoutes.get('/invoices/:invoiceId', RequireAuth, billingController.GetInvoice);
billingRoutes.post('/sync', RequireAuth, billingController.Sync);

/**
 * `/api/billing/webhook` — Razorpay's deliveries. Mounted before the JSON body parser (see app.ts), because the
 * signature is checked against the raw body.
 */
export const billingWebhookRoutes = Router();

billingWebhookRoutes.post('/', express.raw({ type: 'application/json', limit: '1mb' }), billingController.Webhook);
