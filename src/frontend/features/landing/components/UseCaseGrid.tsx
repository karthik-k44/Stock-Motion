import { Link } from 'react-router';
import { Text } from '@/frontend/components/text';
import { NavigationMenuLink } from '@/frontend/components/ui/navigation-menu';
import { Cn } from '@/frontend/lib/utils';
import { USE_CASES, type UseCaseType } from '../lib/landing-content';

const CARD = 'flex min-h-36 flex-col items-start gap-0 rounded-xl border border-transparent bg-sunken p-5 text-left no-underline transition-colors hover:border-primary-200 hover:bg-primary-50';

const Card = ({ useCase, inMenu }: { useCase: UseCaseType; inMenu: boolean }) => {
  const UseCaseIcon = useCase.icon;
  const body = (
    <>
      <UseCaseIcon className="size-4.5 text-muted-foreground" strokeWidth={1.6} aria-hidden />
      <Text variant="feature" as="span" className="mt-auto block pt-8">
        {useCase.title}
      </Text>
      <Text variant="small" as="span" tone="muted" className="mt-1 block">
        {useCase.text}
      </Text>
    </>
  );
  // In the navbar the cards are menu links (arrow keys, Escape); on the page they are anchors to each use case.
  return inMenu ? (
    <NavigationMenuLink asChild className={Cn(CARD, 'focus:bg-primary-50')}>
      <Link to={`/#${useCase.id}`}>{body}</Link>
    </NavigationMenuLink>
  ) : (
    <Link to={`/#${useCase.id}`} className={CARD}>
      {body}
    </Link>
  );
};

/** The six use cases as cards — the navbar's mega menu, laid out like the reference design. */
export const UseCaseGrid = ({ inMenu = false }: { inMenu?: boolean }) => (
  <div>
    <Text variant="eyebrow" className="mb-4">
      Use case
    </Text>
    <ul className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {USE_CASES.map((u) => (
        <li key={u.id}>
          <Card useCase={u} inMenu={inMenu} />
        </li>
      ))}
    </ul>
  </div>
);
