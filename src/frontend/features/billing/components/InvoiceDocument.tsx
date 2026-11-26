import { Badge } from '@/frontend/components/badge';
import { FormatMoney, LongDate } from '../lib/billing-format';
import { INVOICE_FROM, InvoiceLine, PaymentMethodText, PeriodText } from '../lib/invoice-format';
import { InvoiceStatusTypeEnum, type InvoiceResponseType } from '../types';

const Label = ({ children }: { children: string }) => <p className="m-0 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">{children}</p>;

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="m-0 text-right font-medium text-ink">{value}</dd>
  </div>
);

/** The invoice laid out like the PDF: who it's from and to, the line bought, the total and how it was paid. */
export const InvoiceDocument = ({ invoice }: { invoice: InvoiceResponseType }) => {
  const money = (minor: number) => FormatMoney(minor, invoice.currency);
  const paid = invoice.status === InvoiceStatusTypeEnum.PAID;
  const payment: [string, string | null][] = [
    ['Method', PaymentMethodText(invoice)],
    ['Payment ID', invoice.paymentId],
    ['Order ID', invoice.orderId],
    ['Subscription ID', invoice.subscriptionId],
  ];
  return (
    <article aria-label={`Invoice ${invoice.id}`} className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-1 bg-primary" aria-hidden />
      <div className="grid gap-8 p-6 sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xl font-bold text-primary">{INVOICE_FROM.name}</p>
            <p className="m-0 mt-1 text-sm text-muted-foreground">{INVOICE_FROM.email}</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-xl font-bold tracking-wide text-ink">INVOICE</p>
            <p className="m-0 mt-1 font-mono text-sm text-muted-foreground">{invoice.id}</p>
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid content-start gap-1.5">
            <Label>Billed to</Label>
            <p className="m-0 text-sm font-semibold text-ink">{invoice.billedTo.name}</p>
            <p className="m-0 text-sm text-ink-2">{invoice.billedTo.email}</p>
            {invoice.billedTo.contact && <p className="m-0 text-sm text-ink-2">{invoice.billedTo.contact}</p>}
          </div>
          <div className="grid content-start gap-1.5">
            <Label>Invoice details</Label>
            <dl className="m-0 grid gap-1.5">
              <Fact label="Paid on" value={LongDate(invoice.paidAt)} />
              <Fact label="Service period" value={PeriodText(invoice)} />
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="m-0">
                  <Badge tone={paid ? 'good' : 'neutral'}>{paid ? 'Paid' : 'Refunded'}</Badge>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">What was bought</caption>
            <thead>
              <tr>
                <th scope="col">Description</th>
                <th scope="col" className="num">
                  Qty
                </th>
                <th scope="col" className="num">
                  Unit price
                </th>
                <th scope="col" className="num">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <span className="block font-medium text-ink">{InvoiceLine(invoice)}</span>
                  <span className="block text-xs text-muted-foreground">Service period: {PeriodText(invoice)}</span>
                </th>
                <td className="num">{invoice.quantity}</td>
                <td className="num">{money(invoice.unitAmountMinor)}</td>
                <td className="num">{money(invoice.unitAmountMinor * invoice.quantity)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <dl className="m-0 ml-auto grid w-full max-w-72 gap-2">
          <Fact label="Subtotal" value={money(invoice.unitAmountMinor * invoice.quantity)} />
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2">
            <dt className="text-base font-bold text-ink">Total paid</dt>
            <dd className="m-0 text-xl font-bold text-ink tabular-nums">{money(invoice.amountMinor)}</dd>
          </div>
        </dl>

        <div className="grid gap-1.5">
          <Label>Payment</Label>
          <dl className="m-0 grid gap-1.5 sm:max-w-md">
            {payment.map(([label, value]) => value && <Fact key={label} label={label} value={value} />)}
          </dl>
        </div>

        <footer className="border-t border-line pt-4 text-[13px] text-muted-foreground">
          {paid ? 'Paid in full — thank you.' : 'This payment was refunded.'} Amounts in Indian rupees. Questions about this invoice? Write to{' '}
          <a className="font-semibold text-ink underline underline-offset-2" href={`mailto:${INVOICE_FROM.email}`}>
            {INVOICE_FROM.email}
          </a>
          .
        </footer>
      </div>
    </article>
  );
};
