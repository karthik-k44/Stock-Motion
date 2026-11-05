import { describedBy, Field, Select } from '@/frontend/components/form';
import { CURRENCIES, OTHER_CURRENCY } from '../lib/onboarding-options';

type Props = {
  name: string;
  /** What the dropdown shows: a currency code, or OTHER_CURRENCY */
  currencyChoice: string;
  /** The 3-letter code typed when the list doesn't have it */
  otherCurrency: string;
  errors: Record<string, string>;
  onName: (name: string) => void;
  onCurrencyChoice: (choice: string) => void;
  onOtherCurrency: (code: string) => void;
};

const OPTIONS = [...CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` })), { value: OTHER_CURRENCY, label: 'Another currency…' }];

/** The business's name, and the money it counts in. */
export const DetailsStep = ({ name, currencyChoice, otherCurrency, errors, onName, onCurrencyChoice, onOtherCurrency }: Props) => (
  <div className="grid gap-5">
    <Field id="biz-name" label="Business name" error={errors.name}>
      <input
        id="biz-name"
        autoFocus
        autoComplete="organization"
        className="input h-12 rounded-xl text-[15px]"
        placeholder="e.g. Harbor Street Supply"
        value={name}
        maxLength={80}
        onChange={(e) => onName(e.target.value)}
        aria-invalid={Boolean(errors.name)}
        aria-describedby={describedBy('biz-name', errors.name)}
      />
    </Field>
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
