import type { Ref } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';
import { Cn } from '@/frontend/lib/utils';
import type { CameraCommandType } from '../types';

type Props = {
  onCommand: (kind: CameraCommandType['kind']) => void;
  onReset: () => void;
  tags: boolean;
  onToggleTags: () => void;
  ref?: Ref<HTMLDivElement>;
};

const BUTTON = 'grid size-11 place-items-center rounded-xl border-0 bg-transparent text-ink-2 transition-colors hover:bg-primary-50 hover:text-primary-700';

const MOVES: { kind: CameraCommandType['kind']; icon: IconName; label: string }[] = [
  { kind: 'zoomIn', icon: 'plus', label: 'Zoom in' },
  { kind: 'zoomOut', icon: 'minus', label: 'Zoom out' },
  { kind: 'rotateLeft', icon: 'rotateLeft', label: 'Turn left' },
  { kind: 'rotateRight', icon: 'rotateRight', label: 'Turn right' },
];

/** Camera buttons for people who don't drag: zoom, turn, back to the whole view, labels on or off. */
export const CameraToolbar = ({ onCommand, onReset, tags, onToggleTags, ref }: Props) => (
  <div ref={ref} role="toolbar" aria-label="Camera" className="world-tools flex gap-0.5 rounded-2xl border border-line bg-surface p-1.5 shadow-card xl:flex-col">
    {MOVES.map((m) => (
      <button key={m.kind} type="button" className={BUTTON} aria-label={m.label} title={m.label} onClick={() => onCommand(m.kind)}>
        <Icon name={m.icon} size={18} />
      </button>
    ))}
    <button type="button" className={BUTTON} aria-label="Back to the whole view" title="Back to the whole view" onClick={onReset}>
      <Icon name="warehouse" size={18} />
    </button>
    <button
      type="button"
      className={Cn(BUTTON, tags && 'bg-primary-50 text-primary-700')}
      aria-label="Labels in the scene"
      aria-pressed={tags}
      title={tags ? 'Hide labels' : 'Show labels'}
      onClick={onToggleTags}
    >
      <Icon name="layers" size={18} />
    </button>
  </div>
);
