import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { describedBy, Field, SegmentedControl, Select } from '@/frontend/components/form';
import { Modal } from '@/frontend/components/modal';
import { FieldErrors, ToNumber } from '@/frontend/lib/form';
import { FormatQty } from '@/frontend/utils/format';
import { HumanizeReason } from '@/frontend/utils/humanize';
import { ADJUST_MODES, REASON_OPTIONS } from '../lib/inventory-options';
import { NextOnHand } from '../lib/stock-math';
import { inventoryService } from '../services';
import { AdjustModeTypeEnum, AdjustReasonTypeEnum, AdjustStockSchema, type ItemResponseType } from '../types';

type Props = { item: ItemResponseType; onClose: () => void };

/**
 * Two steps: enter the change, then review the before/after and confirm. On confirm the new count
 * shows everywhere at once (optimistic); if the server refuses, it rolls back and the reason shows here.
 */
export const AdjustStockModal = ({ item, onClose }: Props) => {
  const [mode, setMode] = useState<AdjustModeTypeEnum>(AdjustModeTypeEnum.ADD);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState<AdjustReasonTypeEnum>(AdjustReasonTypeEnum.CYCLE_COUNT);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState(false);
  // What was on hand when the count started: a count is absolute, so the server refuses it if stock moved since.
  const [countedFrom] = useState(item.onHand);
  const adjust = inventoryService.useAdjustStockMutation();
  const qtyNum = ToNumber(qty);
  const next = Number.isFinite(qtyNum) ? NextOnHand(item.onHand, mode, qtyNum) : item.onHand;
  const u = (n: number) => FormatQty(n, item.unit);

  const validate = () => {
    const parsed = AdjustStockSchema.safeParse({ mode, qty: qtyNum, reason, note, expectedOnHand: mode === AdjustModeTypeEnum.SET ? countedFrom : undefined });
    const errs = parsed.success ? {} : FieldErrors(parsed.error);
    if (parsed.success && next < 0) errs.qty = `Only ${u(item.onHand)} on hand`;
    else if (parsed.success && next < item.reserved) errs.qty = `${u(item.reserved)} are reserved — on hand can’t go below that`;
    else if (parsed.success && next === item.onHand) errs.qty = 'That would not change the quantity';
    setErrors(errs);
    return parsed.success && !Object.keys(errs).length ? parsed.data : null;
  };

  const submit = () => {
    const input = validate();
    if (!input) return setReviewing(false);
    // Close at once: the new count already shows everywhere. A refusal rolls it back and toasts why.
    adjust.mutate({ sku: item.sku, input });
    onClose();
  };

  const footer = reviewing ? (
    <>
      <Button onClick={() => setReviewing(false)}>Back</Button>
      <Button variant="primary" data-autofocus onClick={submit}>Confirm adjustment</Button>
    </>
  ) : (
    <>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="primary" onClick={() => validate() && setReviewing(true)}>Review change</Button>
    </>
  );

  return (
    <Modal open onClose={onClose} title={reviewing ? 'Confirm stock adjustment' : `Adjust stock · ${item.name}`} footer={footer}>
      {reviewing ? (
        <div className="review">
          <p>
            <strong>{item.name}</strong> <span className="mono muted">{item.sku}</span>
            {item.location && <> in <span className="mono">{item.location}</span></>}
          </p>
          <p className="review-change" aria-live="polite">
            On hand <strong>{u(item.onHand)}</strong> → <strong>{u(next)}</strong> · Available {u(item.available)} → {u(Math.max(next - item.reserved, 0))}
          </p>
          <p className="muted">Reason: {HumanizeReason(reason)}{note && ` — ${note}`}</p>
        </div>
      ) : (
        <form className="form" onSubmit={(e) => (e.preventDefault(), validate() && setReviewing(true))} noValidate>
          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          <SegmentedControl label="Adjustment type" value={mode} options={ADJUST_MODES} onChange={setMode} />
          <Field id="adj-qty" label={mode === AdjustModeTypeEnum.SET ? `Counted quantity (${item.unit})` : `Quantity (${item.unit})`} error={errors.qty} hint={`Currently ${u(item.onHand)} on hand, ${u(item.reserved)} reserved`}>
            <input id="adj-qty" data-autofocus className="input" type="number" inputMode="numeric" min={0} value={qty} aria-invalid={Boolean(errors.qty)} aria-describedby={describedBy('adj-qty', errors.qty, true)} onChange={(e) => setQty(e.target.value)} />
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
};
