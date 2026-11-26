import { Card } from '@/frontend/components/card';
import { RazorpayModeTypeEnum, type BillingResponseType } from '../types';

/** The questions people ask before paying, answered for the way this server takes payment. */
export const BillingFaq = ({ billing }: { billing: BillingResponseType }) => {
  const periodByPeriod = billing.razorpayMode === RazorpayModeTypeEnum.ORDERS;
  const answers = [
    {
      q: 'How is the price worked out?',
      a: 'Per inventory — each shop, café, warehouse or van you run. Starter is ₹299 and Pro ₹699 per inventory a month; paying yearly costs ten months, so two are free.',
    },
    {
      q: 'How do payments work?',
      a: periodByPeriod
        ? 'Each payment buys one month or one year. Nothing renews by itself: we remind you a few days before it ends, and paying early adds the next period on top.'
        : 'Your plan renews every month or year through Razorpay until you cancel. Cancelling keeps it working until the end of the paid period.',
    },
    {
      q: 'What about the free trial?',
      a: 'It lasts 14 days, with all of Pro’s features, for as many inventories as you chose. Paying during the trial doesn’t cut it short — the paid period starts when it ends.',
    },
    {
      q: 'What happens if a plan ends?',
      a: 'Your inventories become read-only for the whole team. Everything stays visible and nothing is deleted — choose a plan and they unlock straight away.',
    },
    { q: 'Can I add inventories or change plans?', a: 'Yes, any time, from “Change plan or inventories”. A different plan or number of inventories starts from the day you pay for it.' },
    { q: 'How do I pay?', a: 'Through Razorpay: UPI, debit and credit cards, net banking and wallets. Your payment details never reach StockMotion.' },
  ];
  return (
    <Card title="Questions about billing">
      <dl className="m-0 grid gap-4 md:grid-cols-2">
        {answers.map(({ q, a }) => (
          <div key={q}>
            <dt className="text-sm font-semibold text-ink">{q}</dt>
            <dd className="m-0 mt-1 text-sm leading-relaxed text-ink-2">{a}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};
