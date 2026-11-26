import { Check, CreditCard, Landmark, Smartphone, Wallet, type LucideIcon } from 'lucide-react';
import { Badge } from '@/frontend/components/badge';
import { MoveRadio } from '@/frontend/features/onboarding/lib/onboarding-options';
import { Cn } from '@/frontend/lib/utils';
import { PaymentMethodEnum } from '../lib/razorpay-checkout';

const METHODS: { value: PaymentMethodEnum; label: string; detail: string; icon: LucideIcon }[] = [
  { value: PaymentMethodEnum.UPI, label: 'UPI', detail: 'Google Pay, PhonePe, Paytm or any UPI app', icon: Smartphone },
  { value: PaymentMethodEnum.CARD, label: 'Card', detail: 'Indian Visa, Mastercard, RuPay and Amex cards', icon: CreditCard },
  { value: PaymentMethodEnum.NETBANKING, label: 'Net banking', detail: 'All major Indian banks', icon: Landmark },
  { value: PaymentMethodEnum.WALLET, label: 'Wallet', detail: 'Paytm, Mobikwik, Freecharge and more', icon: Wallet },
];

/** What happens next for each method, said before the customer presses Pay. */
const NEXT_STEP: Record<PaymentMethodEnum, string> = {
  upi: 'Razorpay opens with UPI: enter your UPI ID or scan the QR code, then approve the payment in your app.',
  card: 'Razorpay opens its secure card form: type your card number, expiry and CVV there — they never reach StockMotion.',
  netbanking: 'Razorpay opens with your bank list: pick your bank and sign in on its page to approve.',
  wallet: 'Razorpay opens with the wallets: pick yours and approve the payment.',
};

type Props = {
  value: PaymentMethodEnum;
  onChange: (method: PaymentMethodEnum) => void;
  /** Test mode: only Razorpay's test cards can complete a payment, so the other methods can't be paid with */
  cardOnly?: boolean;
};

/** Whether a method can be paid with: in test mode, only Card. */
export const IsPayableMethod = (method: PaymentMethodEnum, cardOnly: boolean) => !cardOnly || method === PaymentMethodEnum.CARD;

/** The four ways to pay, as radio cards; Razorpay then opens on the one chosen. */
export const PaymentMethodPicker = ({ value, onChange, cardOnly = false }: Props) => (
  <div className="grid gap-3">
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method" onKeyDown={MoveRadio}>
      {METHODS.map((m) => {
        const selected = m.value === value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(m.value)}
            className={Cn(
              'flex items-center gap-3 rounded-xl border bg-surface p-3.5 text-left transition-[border-color,background-color] duration-150',
              selected ? 'border-primary-500 bg-primary-50 shadow-[0_0_0_1px_var(--color-primary-500)]' : 'border-line hover:border-primary-300',
            )}
          >
            <span className={Cn('grid size-10 flex-none place-items-center rounded-lg', selected ? 'bg-primary text-primary-foreground' : 'bg-sunken text-ink')} aria-hidden>
              <m.icon className="size-5" />
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
                {m.label}
                {cardOnly && m.value === PaymentMethodEnum.CARD && <Badge tone="info">Test platform</Badge>}
              </span>
              <span className="text-xs leading-snug text-ink-2">{m.detail}</span>
            </span>
            {selected && <Check className="size-4 flex-none text-primary" strokeWidth={3} aria-hidden />}
          </button>
        );
      })}
    </div>
    {IsPayableMethod(value, cardOnly) ? (
      <p className="m-0 text-[13px] leading-relaxed text-ink-2">{NEXT_STEP[value]}</p>
    ) : (
      <p className="note" role="status">
        This is a test platform, so only Card works here. Choose Card and pay with the test card 4100 2800 0000 1007.
      </p>
    )}
  </div>
);
