import { Html } from '@react-three/drei';
import { Cn } from '@/frontend/lib/utils';
import { TONE_CLASSES } from '../lib/tones';
import type { ModelKindType, WorldObjectSpecType, WorldTagType } from '../types';

/** How high above the floor each model's tag floats. */
const HEIGHT: Record<ModelKindType, number> = {
  rack: 3.6,
  shelf: 3.4,
  fridge: 3.6,
  freezer: 1.7,
  display: 2.4,
  pallets: 2,
  truck: 3.4,
  van: 2.8,
  bench: 1.9,
  office: 2.9,
  counter: 2,
  till: 1.9,
  coffee: 2.1,
  tables: 1.6,
  houses: 3.2,
};

type Props = { spec: WorldObjectSpecType; tag: WorldTagType; selected: boolean; compact: boolean; onSelect: (id: string) => void };

/**
 * The live label above an object: its short name and what its records say right now.
 * A pointer shortcut only — keyboard and screen-reader users get the same objects in the inspector's list.
 */
export const ObjectTag = ({ spec, tag, selected, compact, onSelect }: Props) => {
  return (
    <Html position={[0, HEIGHT[spec.model], 0]} zIndexRange={[10, 0]} wrapperClass="pointer-events-none">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={(e) => (e.stopPropagation(), onSelect(spec.id))}
        className="pointer-events-auto flex -translate-x-1/2 -translate-y-full cursor-pointer flex-col items-center border-0 bg-transparent p-0"
      >
        <span
          className={Cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-full border py-1 pl-1 text-[11.5px] leading-tight font-semibold shadow-float transition-colors',
            compact ? 'pr-1' : 'pr-2.5',
            selected ? 'border-primary-700 bg-primary-700 text-white' : 'border-line bg-white text-ink hover:border-primary-300',
          )}
        >
          <span className={Cn('rounded-full px-2 py-0.5 text-[11px] font-bold', selected ? 'bg-white text-primary-700' : TONE_CLASSES[tag.tone].solid)}>{spec.short}</span>
          {!compact && <span>{tag.text}</span>}
        </span>
        <span className={Cn('h-3 w-0.5', selected ? 'bg-primary-700' : 'bg-primary-500/60')} />
      </button>
    </Html>
  );
};
