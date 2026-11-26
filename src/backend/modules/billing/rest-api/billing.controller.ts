import type { Request, Response } from 'express';
import { BadRequest } from '@/backend/common/errors';
import { AccountOf } from '@/backend/middleware/auth.middleware';
import { billingCheckoutService } from '../billing-checkout.service';
import { billingInvoicesService } from '../billing-invoices.service';
import { billingService } from '../billing.service';
import { InvoiceIdParamSchema, PlanChoiceSchema, VerifyCheckoutSchema } from '../billing.validators';

export const billingController = {
  Get: async (req: Request, res: Response) => {
    res.json(await billingService.Get(AccountOf(req).id));
  },
  Checkout: async (req: Request, res: Response) => {
    res.json(await billingCheckoutService.Checkout(AccountOf(req), PlanChoiceSchema.parse(req.body)));
  },
  ChooseTrialPlan: async (req: Request, res: Response) => {
    res.json(await billingService.ChooseTrialPlan(AccountOf(req).id, PlanChoiceSchema.parse(req.body)));
  },
  VerifyCheckout: async (req: Request, res: Response) => {
    res.json(await billingCheckoutService.VerifyCheckout(AccountOf(req), VerifyCheckoutSchema.parse(req.body)));
  },
  ListInvoices: async (req: Request, res: Response) => {
    res.json(await billingInvoicesService.List(AccountOf(req).id));
  },
  GetInvoice: async (req: Request, res: Response) => {
    res.json(await billingInvoicesService.Get(AccountOf(req).id, InvoiceIdParamSchema.parse(req.params).invoiceId));
  },
  Cancel: async (req: Request, res: Response) => {
    res.json(await billingCheckoutService.Cancel(AccountOf(req)));
  },
  Sync: async (req: Request, res: Response) => {
    res.json(await billingCheckoutService.Sync(AccountOf(req)));
  },
  /** Mounted with a raw body parser: the signature covers the exact bytes Razorpay sent. */
  Webhook: async (req: Request, res: Response) => {
    const signature = req.header('x-razorpay-signature');
    if (!signature || !Buffer.isBuffer(req.body)) throw BadRequest('Missing webhook signature or body');
    await billingCheckoutService.HandleWebhook(req.body.toString('utf8'), signature, req.header('x-razorpay-event-id'));
    res.json({ ok: true });
  },
};
