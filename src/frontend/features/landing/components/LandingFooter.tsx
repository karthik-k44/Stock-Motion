import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { FOOTER_COLUMNS } from '../lib/landing-content';
import { BrandMark } from './BrandMark';

const LABEL = 'm-0 text-[13px] font-medium text-muted-foreground';
const LINK = 'text-sm font-medium text-ink no-underline transition-colors hover:text-primary-700';

/**
 * The footer: the logo and a line on the left, link columns on the right, then the wordmark set huge behind a skyline of
 * factories, warehouses and a container yard. GSAP lifts the wordmark out from behind it as the page reaches the bottom.
 */
export const LandingFooter = ({ signedIn }: { signedIn: boolean }) => {
  const account = signedIn
    ? [{ label: 'Open StockMotion', href: paths.home }]
    : [
        { label: 'Get started', href: paths.signup },
        { label: 'Log in', href: paths.login },
      ];
  const columns = [...FOOTER_COLUMNS, { title: 'Account', links: account }];

  return (
    <footer className="landing-footer relative isolate overflow-hidden">
      <div className="mx-auto grid max-w-300 grid-cols-2 gap-x-6 gap-y-10 px-4 pt-20 sm:grid-cols-3 sm:px-6 lg:grid-cols-[minmax(0,1.7fr)_repeat(3,minmax(0,1fr))] lg:gap-8">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <BrandMark />
          <p className="mt-3 mb-0 max-w-sm text-sm text-ink-2">Keeping stock rooms honest. One count at a time.</p>
          <p className="mt-2 mb-0 text-xs text-muted-foreground">© {new Date().getFullYear()} StockMotion · 3D icons by 3dicons (CC0)</p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className={LABEL}>{col.title}</h2>
            <ul className="m-0 mt-4 grid list-none gap-3 p-0">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className={LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="landing-footer-stage" aria-hidden>
        <p className="landing-footer-mark">StockMotion</p>
        <img data-footer-scene src="/landing/footer/factories.webp" alt="" width={2400} height={620} loading="lazy" decoding="async" />
      </div>
    </footer>
  );
};
