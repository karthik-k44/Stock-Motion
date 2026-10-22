import { Link } from 'react-router';
import { paths } from '@/frontend/config/paths';
import { FOOTER_COLUMNS } from '../lib/landing-content';
import { EmailStart } from './EmailStart';

const LABEL = 'm-0 text-sm font-semibold tracking-[-0.01em] text-white';
const LINK = 'text-sm text-[#b9bbc6] no-underline transition-colors hover:text-white';

/**
 * The footer: the Watts layout (half-round left edge, columns, a way to start, the wordmark set huge and cropped
 * along the bottom) in the reference's colours — Abyss, white headings, Mist links.
 */
export const LandingFooter = ({ signedIn }: { signedIn: boolean }) => (
  <footer className="px-3 pt-8 pb-3 sm:px-4 sm:pb-4">
    <div className="landing-footer landing-grain relative isolate overflow-hidden text-white">
      <div className="relative mx-auto grid max-w-300 gap-10 px-6 pt-16 sm:px-10 md:grid-cols-2 lg:grid-cols-[1.25fr_0.7fr_0.8fr_1.35fr] lg:gap-8 lg:pl-[max(2.5rem,7vw)]">
        <div>
          <p className="m-0 max-w-[19rem] text-xl leading-snug font-semibold tracking-[-0.01em]">Keeping stock rooms honest. One count at a time.</p>
          <p className="mt-3 mb-0 text-xs text-[#b9bbc6]">© {new Date().getFullYear()} StockMotion · 3D icons by 3dicons (CC0)</p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className={LABEL}>{col.title}</h2>
            <ul className="mt-4 grid list-none gap-2.5 p-0">
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

        <div>
          <h2 className={LABEL}>{signedIn ? 'Back to work' : 'Start with your email'}</h2>
          {signedIn ? (
            <Link to={paths.home} className="mt-4 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground no-underline hover:bg-primary-600">
              Open StockMotion
            </Link>
          ) : (
            <>
              <EmailStart dark className="mt-4" />
              <p className="mt-4 mb-0 text-[13px] text-[#b9bbc6]">
                Already using StockMotion?{' '}
                <Link to={paths.login} className="font-medium text-white underline underline-offset-4">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <p className="landing-footer-mark" aria-hidden>
        stockmotion
      </p>
    </div>
  </footer>
);
