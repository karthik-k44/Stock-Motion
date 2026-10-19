import { Cn } from '@/frontend/lib/utils';

export function Skeleton({ height = 16, width = '100%', className }: { height?: number; width?: number | string; className?: string }) {
  return <span className={Cn('skeleton', className)} style={{ height, width }} aria-hidden />;
}

/** A stack of placeholder rows with an accessible loading label. */
export function SkeletonRows({ rows = 6, height = 44, label = 'Loading' }: { rows?: number; height?: number; label?: string }) {
  return (
    <div className="skeleton-rows" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  );
}
