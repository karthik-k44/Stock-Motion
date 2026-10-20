import type { Ref } from 'react';
import { Icon, type IconName } from '@/frontend/components/icon';
import { Button } from '@/frontend/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import { Cn } from '@/frontend/lib/utils';
import type { CameraCommandType } from '../types';

type Props = {
  onCommand: (command: CameraCommandType) => void;
  tags: boolean;
  onToggleTags: () => void;
  ref?: Ref<HTMLDivElement>;
};

const MOVES: { command: CameraCommandType; icon: IconName; label: string }[] = [
  { command: 'zoomIn', icon: 'plus', label: 'Zoom in' },
  { command: 'zoomOut', icon: 'minus', label: 'Zoom out' },
  { command: 'rotateLeft', icon: 'rotateLeft', label: 'Turn left' },
  { command: 'rotateRight', icon: 'rotateRight', label: 'Turn right' },
  { command: 'reset', icon: 'warehouse', label: 'Back to the whole view' },
];

const ToolButton = ({ icon, label, pressed, onClick }: { icon: IconName; label: string; pressed?: boolean; onClick: () => void }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        className={Cn('size-11 rounded-xl text-ink-2 hover:bg-accent hover:text-accent-foreground', pressed && 'bg-accent text-accent-foreground')}
      >
        <Icon name={icon} size={18} />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="left">{label}</TooltipContent>
  </Tooltip>
);

/** Camera buttons for people who don't drag: zoom, turn, back to the whole view, labels on or off. */
export const CameraToolbar = ({ onCommand, tags, onToggleTags, ref }: Props) => (
  <div ref={ref} role="toolbar" aria-label="Camera" className="world-tools flex gap-0.5 rounded-2xl border border-line bg-surface p-1.5 shadow-card xl:flex-col">
    {MOVES.map((m) => (
      <ToolButton key={m.command} icon={m.icon} label={m.label} onClick={() => onCommand(m.command)} />
    ))}
    <ToolButton icon="layers" label={tags ? 'Hide labels' : 'Show labels'} pressed={tags} onClick={onToggleTags} />
  </div>
);
