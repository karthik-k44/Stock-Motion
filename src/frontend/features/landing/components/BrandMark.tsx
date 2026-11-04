import { Link } from 'react-router';
import { Logo } from '@/frontend/components/logo';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';

/** The logo as a link home, in the navbar and the footer. */
export const BrandMark = ({ className }: { className?: string }) => (
  <Link to={paths.landing} className={Cn('inline-flex no-underline', className)} aria-label="StockMotion home">
    <Logo />
  </Link>
);
