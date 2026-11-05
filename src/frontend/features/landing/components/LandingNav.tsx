import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/frontend/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/frontend/components/ui/navigation-menu';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';
import { NAV_LINKS } from '../lib/landing-content';
import { BrandMark } from './BrandMark';
import { MobileNav } from './MobileNav';
import { UseCaseGrid } from './UseCaseGrid';

const ITEM = 'h-9 rounded-xl px-3 text-sm font-medium tracking-[-0.01em] text-ink hover:bg-sunken focus:bg-sunken';

/** The mega panel spans the whole bar. Same variant prefix as shadcn's defaults, so tailwind-merge replaces them. */
const PANEL = [
  'md:right-0 md:left-0 md:w-auto',
  'group-data-[viewport=false]/navigation-menu:mt-2',
  'group-data-[viewport=false]/navigation-menu:rounded-xl',
  'group-data-[viewport=false]/navigation-menu:border-line',
  'group-data-[viewport=false]/navigation-menu:bg-white',
  'group-data-[viewport=false]/navigation-menu:p-5',
  'group-data-[viewport=false]/navigation-menu:shadow-[0_24px_60px_-24px_rgb(0_7_16/0.25)]',
].join(' ');

/**
 * The marketing navbar (docs/design/style-reference.md): a Carbon announcement bar, then a white bar with the
 * wordmark, a "Use cases" mega menu spanning the whole bar, plain links, "Log in" as text and one orange
 * "Get started". shadcn NavigationMenu gives hover intent, arrow keys and Escape.
 */
export const LandingNav = ({ signedIn }: { signedIn: boolean }) => {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <p className="m-0 flex h-9 items-center justify-center gap-2 bg-carbon px-4 text-xs font-medium tracking-[-0.01em] text-white">
        <span className="truncate">New: the live world now draws cafés and trades, too.</span>
        <Link to={paths.features} className="inline-flex flex-none items-center gap-1 text-primary no-underline hover:underline">
          See the features <ArrowRight className="size-3" aria-hidden />
        </Link>
      </p>
      <div className={Cn('bg-white transition-shadow duration-200', scrolled && 'shadow-[0_1px_0_var(--color-line)]')}>
        <NavigationMenu viewport={false} className="mx-auto w-full max-w-300 flex-none px-4 *:w-full sm:px-6" aria-label="Main">
          <NavigationMenuList className="h-16 w-full justify-start gap-1">
            <NavigationMenuItem className="mr-6">
              <BrandMark />
            </NavigationMenuItem>

            <NavigationMenuItem className="static hidden md:block">
              <NavigationMenuTrigger className={Cn(ITEM, 'bg-transparent data-[state=open]:bg-sunken')}>Use cases</NavigationMenuTrigger>
              <NavigationMenuContent className={PANEL}>
                <UseCaseGrid inMenu />
              </NavigationMenuContent>
            </NavigationMenuItem>

            {NAV_LINKS.map((l) => (
              <NavigationMenuItem key={l.href} className={l.wideOnly ? 'hidden lg:block' : 'hidden md:block'}>
                <NavigationMenuLink asChild active={pathname === l.href} className={Cn(ITEM, 'flex-row items-center data-[active=true]:bg-sunken')}>
                  <Link to={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
                    {l.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}

            <NavigationMenuItem className="ml-auto flex items-center gap-1">
              {signedIn ? (
                <Button asChild className="h-9 rounded-xl px-4 text-sm font-semibold">
                  <Link to={paths.home}>Open StockMotion</Link>
                </Button>
              ) : (
                <>
                  <Link to={paths.login} className="hidden h-9 items-center rounded-xl px-3 text-sm font-medium text-ink no-underline hover:bg-sunken sm:inline-flex">
                    Log in
                  </Link>
                  <Button asChild className="h-9 rounded-xl px-4 text-sm font-semibold">
                    <Link to={paths.signup}>Get started</Link>
                  </Button>
                </>
              )}
              <MobileNav signedIn={signedIn} />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
};
