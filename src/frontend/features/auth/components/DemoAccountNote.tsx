import { Button } from '@/frontend/components/button';
import { DEMO_ACCOUNT } from '../lib/demo-account';

type Props = { busy: boolean; onUse: () => void };

/** The shared demo account's credentials, and a one-click way in. */
export const DemoAccountNote = ({ busy, onUse }: Props) => (
  <aside aria-labelledby="demo-account-title" className="mt-6 rounded-xl border border-line bg-sunken p-4">
    <p id="demo-account-title" className="m-0 text-sm font-semibold text-ink">
      Just looking around?
    </p>
    <p className="m-0 mt-1 text-[13px] leading-relaxed text-ink-2">
      Try the shared demo account: a shop, a café and a trades business, full of sample data. Anyone can change it, and it
      starts fresh every day — your own account stays empty until you add to it.
    </p>
    <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
      <dt className="text-muted-foreground">Email</dt>
      <dd className="mono m-0 text-ink">{DEMO_ACCOUNT.email}</dd>
      <dt className="text-muted-foreground">Password</dt>
      <dd className="mono m-0 text-ink">{DEMO_ACCOUNT.password}</dd>
    </dl>
    <Button className="mt-3 w-full" loading={busy} onClick={onUse}>
      Explore the demo
    </Button>
  </aside>
);
