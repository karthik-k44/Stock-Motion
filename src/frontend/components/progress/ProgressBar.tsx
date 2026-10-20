import { Clamp } from '@/frontend/lib/utils';

type ProgressBarProps = { value: number; max: number; label: string; tone?: 'default' | 'good' };

export const ProgressBar = ({ value, max, label, tone = 'default' }: ProgressBarProps) => {
  const pct = max > 0 ? Clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span className={tone === 'good' || pct === 100 ? 'progress-fill progress-good' : 'progress-fill'} style={{ width: `${pct}%` }} />
    </div>
  );
};
