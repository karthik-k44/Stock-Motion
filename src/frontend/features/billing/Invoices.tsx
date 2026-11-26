import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Badge } from '@/frontend/components/badge';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { PageHeader } from '@/frontend/components/layout';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import { paths } from '@/frontend/config/paths';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { InvoiceDocument } from './components/InvoiceDocument';
import { FormatMoney, Inventories, INTERVAL_LABEL } from './lib/billing-format';
import { PeriodText, ShortDate } from './lib/invoice-format';
import { DownloadInvoicePdf } from './lib/invoice-pdf';
import { billingService } from './services';
import { InvoiceStatusTypeEnum, type InvoiceResponseType } from './types';

/** Download an invoice's PDF, with a busy state while it's built. */
const useDownload = () => {
  const [busy, setBusy] = useState<string | null>(null);
  const download = async (invoice: InvoiceResponseType) => {
    setBusy(invoice.id);
    try {
      await DownloadInvoicePdf(invoice);
    } catch (err) {
      ToastManager.Error('Couldn’t download the invoice', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusy(null);
    }
  };
  return { busy, download };
};

const InvoiceList = () => {
  const navigate = useNavigate();
  const invoices = billingService.useGetInvoices();
  const { busy, download } = useDownload();

  if (invoices.isPending) return <SkeletonRows rows={4} label="Loading invoices" />;
  if (invoices.isError) return <ErrorState message={invoices.error.message} onRetry={() => invoices.refetch()} />;
  if (!invoices.data.length) {
    return (
      <Card>
        <EmptyState
          icon="receipt"
          title="No invoices yet"
          action={
            <Button variant="primary" onClick={() => navigate(paths.billing)}>
              Go to billing
            </Button>
          }
        >
          An invoice appears here each time you pay for your plan.
        </EmptyState>
      </Card>
    );
  }

  return (
    <Card flush>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Your invoices, newest first</caption>
          <thead>
            <tr>
              <th scope="col">Invoice</th>
              <th scope="col">Paid on</th>
              <th scope="col">Plan</th>
              <th scope="col">Service period</th>
              <th scope="col" className="num">
                Amount
              </th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="sr-only">Download</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.data.map((inv) => (
              <tr key={inv.id}>
                <th scope="row">
                  <Link to={paths.invoice(inv.id)} className="font-mono font-semibold text-ink underline-offset-2 hover:underline">
                    {inv.id}
                  </Link>
                </th>
                <td>{ShortDate(inv.paidAt)}</td>
                <td>
                  {inv.plan.name} · {Inventories(inv.quantity)} · {INTERVAL_LABEL[inv.interval]}
                </td>
                <td className="whitespace-nowrap">{PeriodText(inv)}</td>
                <td className="num font-semibold">{FormatMoney(inv.amountMinor, inv.currency)}</td>
                <td>
                  <Badge tone={inv.status === InvoiceStatusTypeEnum.PAID ? 'good' : 'neutral'}>{inv.status === InvoiceStatusTypeEnum.PAID ? 'Paid' : 'Refunded'}</Badge>
                </td>
                <td className="text-right">
                  <Button size="sm" variant="ghost" icon="download" loading={busy === inv.id} onClick={() => void download(inv)} aria-label={`Download invoice ${inv.id} as PDF`}>
                    PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const InvoiceDetail = ({ id }: { id: string }) => {
  const invoice = billingService.useGetInvoice(id);
  const { busy, download } = useDownload();
  if (invoice.isPending) return <SkeletonRows rows={6} label="Loading invoice" />;
  if (invoice.isError) return <ErrorState message={invoice.error.message} onRetry={() => invoice.refetch()} />;
  return (
    <div className="grid max-w-4xl gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={paths.invoices} className="text-sm font-semibold text-ink-2 hover:text-ink">
          ← All invoices
        </Link>
        <Button variant="primary" loading={busy === invoice.data.id} onClick={() => void download(invoice.data)}>
          Download PDF
        </Button>
      </div>
      <InvoiceDocument invoice={invoice.data} />
    </div>
  );
};

/** Every payment for the plan as an invoice, each viewable in full and downloadable as a PDF. */
export const Invoices = () => {
  const { id } = useParams();
  useDocumentTitle(id ? `Invoice ${id}` : 'Invoices');
  return (
    <div className="page">
      <PageHeader title={id ? `Invoice ${id}` : 'Invoices'} description="A record of every payment for your plan. Download any invoice as a PDF for your accounts." />
      {id ? <InvoiceDetail id={id} /> : <InvoiceList />}
    </div>
  );
};
