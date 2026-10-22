import { Progress } from '@/frontend/components/ui/progress';
import { Clamp, Cn } from '@/frontend/lib/utils';

type ProgressBarProps = { value: number; max: number; label: string; tone?: 'default' | 'good' };

/** shadcn/ui Progress, as a share of `max`. Full turns green. */
export const ProgressBar = ({ value, max, label, tone = 'default' }: ProgressBarProps) => {
  const pct = max > 0 ? Clamp((value / max) * 100, 0, 100) : 0;
  return (
    <Progress
      value={pct}
      aria-label={label}
      className={Cn('h-1.5 bg-sunken', (tone === 'good' || pct === 100) && '**:data-[slot=progress-indicator]:bg-success')}
    />
  );
};
