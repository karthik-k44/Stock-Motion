import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { ReceiveDeliverySchema, type DeliveryResponseType, type ReceiveDeliveryInput } from '../types';

type Props = {
  delivery: DeliveryResponseType;
  busy: boolean;
  onSubmit: (input: ReceiveDeliveryInput, watch: boolean) => void;
};

/** Counted quantities per line (defaults to expected), validated before the truck is unloaded. */
export function ReceiveLinesForm({ delivery, busy, onSubmit }: Props) {
  const [counts, setCounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(delivery.lines.map((l) => [l.sku, String(l.expected)])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [watch, setWatch] = useState(true);

  const submit = () => {
    const input = { lines: delivery.lines.map((l) => ({ sku: l.sku, received: counts[l.sku] === '' ? NaN : Number(counts[l.sku]) })) };
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
    onSubmit(parsed.data, watch);
  };

  return (
    <form className="form" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
      <div className="table-wrap">
        <table className="table table-compact">
          <caption className="sr-only">Expected and counted quantities</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Bin</th>
              <th scope="col" className="num">Expected</th>
              <th scope="col" className="num">Counted at dock</th>
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
                <td className="num">{l.expected}</td>
                <td className="num">
                  <input
                    className="input input-num"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    aria-label={`Counted quantity for ${l.name}`}
                    aria-invalid={Boolean(errors[l.sku])}
                    aria-describedby={errors[l.sku] ? `err-${l.sku}` : undefined}
                    value={counts[l.sku]}
                    onChange={(e) => setCounts((c) => ({ ...c, [l.sku]: e.target.value }))}
                  />
                  {errors[l.sku] && (
                    <span id={`err-${l.sku}`} className="field-error" role="alert">
                      {errors[l.sku]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label className="check">
        <input type="checkbox" checked={watch} onChange={(e) => setWatch(e.target.checked)} />
        Watch the truck arrive on the warehouse floor
      </label>
      <div className="form-actions">
        <Button type="submit" variant="primary" icon="truck" disabled={busy}>
          Receive &amp; unload
        </Button>
        {busy && <span className="muted small">Dock 1 is busy with another truck.</span>}
      </div>
    </form>
  );
}
