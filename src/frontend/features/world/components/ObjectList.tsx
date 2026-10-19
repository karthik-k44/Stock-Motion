import { Icon } from '@/frontend/components/icon';
import { Cn } from '@/frontend/lib/utils';
import type { WorldContextType, WorldObjectSpecType } from '../types';

type Props = { objects: WorldObjectSpecType[]; ctx: WorldContextType; selected: string | null; onSelect: (id: string) => void };

/** The same objects as plain buttons — for keyboards, screen readers and small screens. */
export function ObjectList({ objects, ctx, selected, onSelect }: Props) {
  return (
    <nav className="world-list" aria-label="Objects in the world">
      <ul>
        {objects.map((o) => {
          const alert = Boolean(o.alert?.(ctx));
          return (
            <li key={o.id}>
              <button type="button" className={Cn('world-list-item', selected === o.id && 'world-list-item-on')} aria-pressed={selected === o.id} onClick={() => onSelect(o.id)}>
                {alert && <Icon name="alert" size={13} label="Needs attention" className="text-critical" />}
                {o.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
