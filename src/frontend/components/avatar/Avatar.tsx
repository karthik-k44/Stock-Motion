import { Cn } from '@/frontend/lib/utils';

type AvatarProps = { initials: string; color: string; name: string; size?: 'sm' | 'md' };

export const Avatar = ({ initials, color, name, size = 'md' }: AvatarProps) => {
  return (
    <span className={Cn('avatar', size === 'sm' && 'avatar-sm')} style={{ background: color }} title={name} aria-hidden>
      {initials}
    </span>
  );
};
