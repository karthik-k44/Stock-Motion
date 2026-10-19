import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { describedBy, Field, SegmentedControl, Select } from '@/frontend/components/form';
import { Modal } from '@/frontend/components/modal';
import { HumanizeReason } from '@/frontend/utils/humanize';
import { ADJUST_MODES, NextOnHand, REASON_OPTIONS } from '../lib/inventory-options';
import { inventoryService } from '../services';
import { AdjustModeTypeEnum, AdjustReasonTypeEnum, AdjustStockSchema, type ItemResponseType } from '../types';

type Props = { item: ItemResponseType; open: boolean; onClose: () => void; onDone: () => void };

/** Two steps: enter the change, then review the before/after and confirm. */
export function AdjustStockModal({ item, open, onClose, onDone }: Props) {
  const [mode, setMode] = useState<AdjustModeTypeEnum>(AdjustModeTypeEnum.ADD);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState<AdjustReasonTypeEnum>(AdjustReasonTypeEnum.CYCLE_COUNT);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState(false);
  const adjust = inventoryService.useAdjustStockMutation();

  const qtyNum = qty === '' ? NaN : Number(qty);
  const next = Number.isFinite(qtyNum) ? NextOnHand(item.onHand, mode, qtyNum) : item.onHand;

  const validate = () => {
    const parsed = AdjustStockSchema.safeParse({ mode, qty: Number.isFinite(qtyNum) ? qtyNum : undefined, reason, note });
    const errs: Record<string, string> = {};
    if (!parsed.success) parsed.error.issues.forEach((i) => (errs[String(i.path[0])] ??= i.message));
    else if (next < 0) errs.qty = `Only ${item.onHand} on hand`;
    else if (next < item.reserved) errs.qty = `${item.reserved} are reserved for picking — on hand can’t go below that`;
    else if (next === item.onHand) errs.qty = 'That would not change the quantity';
    setErrors(errs);
    return Object.keys(errs).length === 0 && parsed.success ? parsed.data : null;
  };

  const submit = () => {
    const input = validate();
    if (!input) return setReviewing(false);
    adjust.mutate(
      { sku: item.sku, input },
      {
        onSuccess: () => onDone(),
        onError: (err) => {
          setErrors({ form: err.message, ...err.fieldErrors() });
          setReviewing(false);
        },
      },
    );
  };

  const footer = reviewing ? (
    <>
      <Button onClick={() => setReviewing(false)}>Back</Button>
      <Button variant="primary" data-autofocus loading={adjust.isPending} onClick={submit}>
        Confirm adjustment
      </Button>
    </>
  ) : (
    <>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={() => validate() && setReviewing(true)}>
        Review change
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={reviewing ? 'Confirm stock adjustment' : `Adjust stock · ${item.name}`} footer={footer}>
      {reviewing ? (
        <div className="review">
          <p>
            <strong>{item.name}</strong> <span className="mono muted">{item.sku}</span> in bin <span className="mono">{item.location}</span>
          </p>
          <p className="review-change" aria-live="polite">
            On hand <strong>{item.onHand}</strong> → <strong>{next}</strong> · Available {item.available} → {next - item.reserved}
          </p>
          <p className="muted">
            Reason: {HumanizeReason(reason)}
            {note && ` — ${note}`}
          </p>
        </div>
      ) : (
        <form className="form" onSubmit={(e) => (e.preventDefault(), validate() && setReviewing(true))} noValidate>
          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          <SegmentedControl label="Adjustment type" value={mode} options={ADJUST_MODES} onChange={setMode} />
          <Field id="adj-qty" label={mode === AdjustModeTypeEnum.SET ? 'Counted quantity' : 'Quantity'} error={errors.qty} hint={`Currently ${item.onHand} on hand, ${item.reserved} reserved`}>
            <input
              id="adj-qty"
              data-autofocus
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              value={qty}
              aria-invalid={Boolean(errors.qty)}
              aria-describedby={describedBy('adj-qty', errors.qty, true)}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field>
          <Field id="adj-reason" label="Reason">
            <Select id="adj-reason" value={reason} options={REASON_OPTIONS} onChange={(v) => setReason(v as AdjustReasonTypeEnum)} />
          </Field>
          <Field id="adj-note" label={reason === AdjustReasonTypeEnum.OTHER ? 'Note (required)' : 'Note (optional)'} error={errors.note}>
            <textarea id="adj-note" className="input" rows={2} maxLength={200} value={note} aria-invalid={Boolean(errors.note)} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <button type="submit" hidden />
        </form>
      )}
    </Modal>
  );
}
