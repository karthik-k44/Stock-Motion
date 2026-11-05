import { Menu } from 'lucide-react';
import { Link } from 'react-router';
import { Text } from '@/frontend/components/text';
import { Button } from '@/frontend/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/frontend/components/ui/sheet';
import { paths } from '@/frontend/config/paths';
import { NAV_LINKS, USE_CASES } from '../lib/landing-content';

/** Phones and small tablets: the navbar's contents in a sheet. Every link closes it. */
export const MobileNav = ({ signedIn }: { signedIn: boolean }) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="right" className="w-[88vw] gap-0 overflow-y-auto bg-surface p-0 sm:max-w-sm">
      <SheetHeader className="border-b border-line px-5 py-4">
        <SheetTitle className="text-lg font-semibold tracking-[-0.02em]">StockMotion</SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>
      </SheetHeader>
      <nav aria-label="Mobile" className="grid gap-6 px-5 py-5">
        <div>
          <Text variant="eyebrow" className="mb-2">
            Use case
          </Text>
          <ul className="m-0 grid list-none gap-1 p-0">
            {USE_CASES.map((u) => {
              const UseCaseIcon = u.icon;
              return (
                <li key={u.id}>
                  <SheetClose asChild>
                    <Link to={`/#${u.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-ink no-underline hover:bg-sunken">
                      <UseCaseIcon className="size-4 text-muted-foreground" strokeWidth={1.6} aria-hidden />
                      <span className="text-[15px] font-medium tracking-[-0.01em]">{u.title}</span>
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </div>
        <ul className="m-0 grid list-none gap-1 border-t border-line p-0 pt-4">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <SheetClose asChild>
                <Link to={l.href} className="block rounded-xl px-2 py-2.5 text-[15px] font-medium text-ink no-underline hover:bg-sunken">
                  {l.label}
                </Link>
              </SheetClose>
            </li>
          ))}
        </ul>
        <div className="grid gap-2">
          {signedIn ? (
            <Button asChild className="h-11 rounded-xl font-semibold">
              <Link to={paths.home}>Open StockMotion</Link>
            </Button>
          ) : (
            <>
              <Button asChild className="h-11 rounded-xl font-semibold">
                <Link to={paths.signup}>Get started</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl font-semibold">
                <Link to={paths.login}>Log in</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </SheetContent>
  </Sheet>
);
