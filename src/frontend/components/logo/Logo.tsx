import { Cn } from '@/frontend/lib/utils';

const ORANGE = '#ff7900';
const DEEP = '#b35500';

/** One ribbon of tape folded into an S on isometric lines, so its outline also reads as a box. public/brand has it as files. */
const FOLDS = [
  '54,13.05 32,0.35 32,12.85 54,25.55',
  '32,0.35 10,13.05 10,25.55 32,12.85',
  '10,13.05 54,38.45 54,50.95 10,25.55',
  '54,38.45 32,51.15 32,63.65 54,50.95',
  '32,51.15 10,38.45 10,50.95 32,63.65',
];

/** The mark on its own. Size it by height; the width follows. */
export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="10 0 44 64" className={Cn('block h-8 w-auto flex-none', className)} aria-hidden>
    {FOLDS.map((points, i) => (
      <polygon key={points} points={points} fill={i % 2 ? DEEP : ORANGE} />
    ))}
  </svg>
);

/** The name, heavy then lighter. Takes its size and colour from around it. */
export const LogoName = () => (
  <span className="font-bold tracking-[-0.035em]">
    Stock<span className="font-medium">Motion</span>
  </span>
);

/** The mark with the name. `className` sets the text size and `markClassName` the mark's height. */
export const Logo = ({ className, markClassName }: { className?: string; markClassName?: string }) => (
  <span className={Cn('inline-flex items-center gap-2 text-[20px] leading-none text-ink', className)}>
    <LogoMark className={markClassName} />
    <LogoName />
  </span>
);
