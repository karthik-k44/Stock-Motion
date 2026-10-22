import { Link } from 'react-router';
import { Icon } from '@/frontend/components/icon';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';

/** The StockMotion logo: the box mark on brand orange and the wordmark. */
export const BrandMark = ({ className }: { className?: string }) => (
  <Link to={paths.landing} className={Cn('inline-flex items-center gap-2 text-ink no-underline', className)} aria-label="StockMotion home">
    <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden>
      <Icon name="package" size={18} />
    </span>
    <span className="text-[20px] leading-none font-semibold tracking-[-0.035em]">StockMotion</span>
  </Link>
);
