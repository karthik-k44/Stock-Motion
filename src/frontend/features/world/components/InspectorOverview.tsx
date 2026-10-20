import { Icon } from '@/frontend/components/icon';
import { Text } from '@/frontend/components/text';
import { Cn } from '@/frontend/lib/utils';
import { TONE_CLASSES } from '../lib/tones';
import type { WorldContextType, WorldObjectSpecType } from '../types';

type Props = {
  businessName: string;
  objects: WorldObjectSpecType[];
  ctx: WorldContextType;
  onSelect: (id: string) => void;
};

/**
 * Nothing selected: the business and every object in it with its live status.
 * Also the keyboard and screen-reader way into the scene — the same objects as buttons.
 */
export const InspectorOverview = ({ businessName, objects, ctx, onSelect }: Props) => (
  <div className="flex min-h-0 flex-1 flex-col gap-4">
    <header className="grid gap-2">
      <Text variant="eyebrow">{ctx.template.name}</Text>
      <Text variant="heading" as="h2">
        {businessName}
      </Text>
      <Text variant="small" tone="secondary">
        Everything here is your own data. Click a shelf, a vehicle or a row below to see what it holds; drag to turn, scroll to zoom.
      </Text>
    </header>
    <nav aria-label="Places in the world" className="min-h-0">
      <ul className="m-0 grid gap-1.5">
        {objects.map((o) => {
          const tag = o.tag(ctx);
          const alert = Boolean(o.alert?.(ctx));
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <span className="grid size-8 flex-none place-items-center rounded-lg bg-sunken text-ink-2" aria-hidden>
                  <Icon name={o.icon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <Text as="span" variant="small" weight="semibold" className="block" truncate>
                    {o.label}
                  </Text>
                  <Text as="span" variant="caption" tone="inherit" className={Cn('block', TONE_CLASSES[tag.tone].text)} truncate>
                    {tag.text}
                  </Text>
                </span>
                {alert && <Icon name="alert" size={15} label="Needs attention" className="flex-none text-danger" />}
                <Icon name="chevronRight" size={15} className="flex-none text-muted" />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  </div>
);
