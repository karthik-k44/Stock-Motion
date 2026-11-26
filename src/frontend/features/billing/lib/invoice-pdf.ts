import { InvoiceStatusTypeEnum, type InvoiceResponseType } from '../types';
import { INVOICE_FROM, InvoiceFileName, InvoiceLine, MoneyWithCode, PaymentMethodText, PeriodText, ShortDate } from './invoice-format';

const BRAND: [number, number, number] = [232, 107, 44];
const INK: [number, number, number] = [28, 25, 23];
const MUTED: [number, number, number] = [120, 113, 108];
const LINE: [number, number, number] = [226, 222, 218];

/**
 * Build the invoice as an A4 PDF in the browser and save it. jsPDF loads on the first download only, so it never
 * weighs on other pages.
 */
export const DownloadInvoicePdf = async (inv: InvoiceResponseType): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const left = 20;
  const right = 190;
  const money = (minor: number) => MoneyWithCode(minor, inv.currency);

  const text = (value: string, x: number, y: number, opts: { size?: number; bold?: boolean; color?: [number, number, number]; align?: 'left' | 'right' } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size ?? 10);
    doc.setTextColor(...(opts.color ?? INK));
    doc.text(value, x, y, { align: opts.align ?? 'left' });
  };
  const rule = (y: number) => {
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(left, y, right, y);
  };

  // Header: who it's from, and what it is.
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, 210, 4, 'F');
  text(INVOICE_FROM.name, left, 22, { size: 18, bold: true, color: BRAND });
  text(INVOICE_FROM.email, left, 28, { color: MUTED });
  text('INVOICE', right, 22, { size: 18, bold: true, align: 'right' });
  text(inv.id, right, 28, { color: MUTED, align: 'right' });

  // Billed to, and the invoice's facts.
  let y = 44;
  text('BILLED TO', left, y, { size: 8, bold: true, color: MUTED });
  text('INVOICE DETAILS', 120, y, { size: 8, bold: true, color: MUTED });
  y += 6;
  const billed = [inv.billedTo.name, inv.billedTo.email, inv.billedTo.contact].filter((v): v is string => Boolean(v));
  billed.forEach((line, i) => text(line, left, y + i * 5.5, { bold: i === 0 }));
  const facts: [string, string][] = [
    ['Invoice number', inv.id],
    ['Paid on', ShortDate(inv.paidAt)],
    ['Status', inv.status === InvoiceStatusTypeEnum.PAID ? 'Paid' : 'Refunded'],
    ['Service period', PeriodText(inv)],
  ];
  facts.forEach(([label, value], i) => {
    text(label, 120, y + i * 5.5, { color: MUTED });
    text(value, right, y + i * 5.5, { align: 'right' });
  });

  // The line item.
  y += Math.max(billed.length, facts.length) * 5.5 + 10;
  doc.setFillColor(247, 245, 243);
  doc.rect(left, y - 5, right - left, 8, 'F');
  text('Description', left + 2, y, { size: 9, bold: true, color: MUTED });
  text('Qty', 120, y, { size: 9, bold: true, color: MUTED, align: 'right' });
  text('Unit price', 152, y, { size: 9, bold: true, color: MUTED, align: 'right' });
  text('Amount', right - 2, y, { size: 9, bold: true, color: MUTED, align: 'right' });
  y += 10;
  const description = doc.splitTextToSize(InvoiceLine(inv), 88) as string[];
  description.forEach((line, i) => text(line, left + 2, y + i * 5));
  text(`Service period: ${PeriodText(inv)}`, left + 2, y + description.length * 5, { size: 8.5, color: MUTED });
  text(String(inv.quantity), 120, y, { align: 'right' });
  text(money(inv.unitAmountMinor), 152, y, { align: 'right' });
  text(money(inv.unitAmountMinor * inv.quantity), right - 2, y, { align: 'right' });
  y += description.length * 5 + 8;
  rule(y);

  // Totals.
  y += 8;
  text('Subtotal', 140, y, { color: MUTED });
  text(money(inv.unitAmountMinor * inv.quantity), right - 2, y, { align: 'right' });
  y += 7;
  text('Total paid', 140, y, { size: 12, bold: true });
  text(money(inv.amountMinor), right - 2, y, { size: 12, bold: true, align: 'right' });

  // How it was paid.
  y += 16;
  text('PAYMENT', left, y, { size: 8, bold: true, color: MUTED });
  y += 6;
  const payment: [string, string | null][] = [
    ['Method', PaymentMethodText(inv)],
    ['Payment ID', inv.paymentId],
    ['Order ID', inv.orderId],
    ['Subscription ID', inv.subscriptionId],
  ];
  for (const [label, value] of payment) {
    if (!value) continue;
    text(label, left, y, { color: MUTED });
    text(value, left + 38, y);
    y += 5.5;
  }

  // Footer.
  rule(272);
  text(inv.status === InvoiceStatusTypeEnum.PAID ? 'Paid in full — thank you.' : 'This payment was refunded.', left, 279, { size: 9 });
  text(`Questions about this invoice? Write to ${INVOICE_FROM.email}`, left, 284, { size: 8.5, color: MUTED });
  text('Amounts in Indian rupees (INR).', right, 279, { size: 8.5, color: MUTED, align: 'right' });

  doc.save(InvoiceFileName(inv));
};
