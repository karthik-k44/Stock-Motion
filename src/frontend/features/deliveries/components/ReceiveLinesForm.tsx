import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { ConfirmManager } from '@/frontend/components/modal';
import { FormatNumber } from '@/frontend/utils/format';
import { deliveriesService } from '../services';
import { ReceiveDeliverySchema, type DeliveryResponseType } from '../types';

/** Counted quantities per line (defaults to expected), checked, confirmed, then added to stock. */
export const ReceiveLinesForm = ({ delivery }: { delivery: DeliveryResponseType }) => {
  const [counts, setCounts] = useState<Record<string, string>>(() => Object.fromEntries(delivery.lines.map((l) => [l.sku, String(l.expected)])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const receive = deliveriesService.useReceiveDelivery();

  const submit = async () => {
    const input = { lines: delivery.lines.map((l) => ({ sku: l.sku, received: counts[l.sku] === '' ? Number.NaN : Number(counts[l.sku]) })) };
    const parsed = ReceiveDeliverySchema.safeParse(input);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const line = delivery.lines[Number(i.path[1])];
        if (line) errs[line.sku] ??= i.message;
      });
      return setErrors(errs);
    }
    setErrors({});
    const total = parsed.data.lines.reduce((s, l) => s + l.received, 0);
    const diffs = parsed.data.lines.filter((l) => l.received !== delivery.lines.find((x) => x.sku === l.sku)?.expected).length;
    const ok = await ConfirmManager.Ask({
      title: `Receive ${delivery.number}?`,
      message: `${FormatNumber(total)} units will be added to stock${diffs ? ` (${diffs} line${diffs > 1 ? 's' : ''} differ from expected)` : ''}.`,
      confirmLabel: 'Receive',
    });
    if (ok) receive.mutate({ number: delivery.number, input: parsed.data });
  };

  return (
    <form className="form" onSubmit={(e) => (e.preventDefault(), void submit())} noValidate>
      <div className="table-wrap">
        <table className="table table-compact">
          <caption className="sr-only">Expected and counted quantities</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Goes to</th>
              <th scope="col" className="num">Expected</th>
              <th scope="col" className="num">Counted</th>
            </tr>
          </thead>
          <tbody>
            {delivery.lines.map((l) => (
              <tr key={l.sku}>
                <th scope="row">
                  <span className="cell-strong">{l.name}</span>
                  <span className="cell-sub mono">{l.sku}</span>
                </th>
                <td className="mono">{l.location ?? '—'}</td>
                <td className="num">{FormatNumber(l.expected)} {l.unit}</td>
                <td className="num">
                  <input
                    className="input input-num"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    aria-label={`Counted ${l.name} (${l.unit})`}
                    aria-invalid={Boolean(errors[l.sku])}
                    aria-describedby={errors[l.sku] ? `err-${l.sku}` : undefined}
                    value={counts[l.sku]}
                    onChange={(e) => setCounts((c) => ({ ...c, [l.sku]: e.target.value }))}
                  />
                  {errors[l.sku] && <span id={`err-${l.sku}`} className="field-error" role="alert">{errors[l.sku]}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="form-actions">
        <Button type="submit" variant="primary" icon="check" loading={receive.isPending}>Receive into stock</Button>
      </div>
    </form>
  );
};
