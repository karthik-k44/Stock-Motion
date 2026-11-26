import { describedBy, Field, Select } from '@/frontend/components/form';
import { CURRENCIES, OTHER_CURRENCY } from '../lib/onboarding-options';

export type DraftInventoryType = { key: string; typeName: string; name: string };

type Props = {
  inventories: DraftInventoryType[];
  /** What the dropdown shows: a currency code, or OTHER_CURRENCY */
  currencyChoice: string;
  /** The 3-letter code typed when the list doesn't have it */
  otherCurrency: string;
  errors: Record<string, string>;
  onName: (key: string, name: string) => void;
  onCurrencyChoice: (choice: string) => void;
  onOtherCurrency: (code: string) => void;
};

const OPTIONS = [...CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` })), { value: OTHER_CURRENCY, label: 'Another currency…' }];

/** A name for each inventory (filled in already, to change now or later in Settings), and the money they count in. */
export const NamesStep = ({ inventories, currencyChoice, otherCurrency, errors, onName, onCurrencyChoice, onOtherCurrency }: Props) => (
  <div className="grid gap-5">
    <div className="grid gap-3">
      {inventories.map((inv, i) => {
        const id = `inv-name-${inv.key}`;
        const error = errors[`inventories.${i}.name`];
        return (
          <Field key={inv.key} id={id} label={`Inventory ${i + 1} · ${inv.typeName}`} error={error}>
            <input
              id={id}
              autoFocus={i === 0}
              autoComplete="organization"
              className="input h-12 rounded-xl text-[15px]"
              placeholder="e.g. Harbor Street Supply"
              value={inv.name}
              maxLength={80}
              onChange={(e) => onName(inv.key, e.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy(id, error)}
            />
          </Field>
        );
      })}
    </div>
    <div className={currencyChoice === OTHER_CURRENCY ? 'grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]' : 'grid'}>
      <Field id="biz-currency" label="Currency" error={currencyChoice === OTHER_CURRENCY ? undefined : errors.currency}>
        <Select id="biz-currency" className="h-12 rounded-xl text-[15px]" value={currencyChoice} options={OPTIONS} onChange={onCurrencyChoice} />
      </Field>
      {currencyChoice === OTHER_CURRENCY && (
        <Field id="biz-currency-code" label="3-letter code" error={errors.currency}>
          <input
            id="biz-currency-code"
            className="input h-12 rounded-xl text-[15px] uppercase sm:w-32"
            placeholder="e.g. MXN"
            value={otherCurrency}
            maxLength={3}
            onChange={(e) => onOtherCurrency(e.target.value.toUpperCase())}
            aria-invalid={Boolean(errors.currency)}
            aria-describedby={describedBy('biz-currency-code', errors.currency)}
          />
        </Field>
      )}
    </div>
  </div>
);
