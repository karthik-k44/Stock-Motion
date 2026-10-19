import { paths } from '@/frontend/config/paths';

/** Only relative in-app paths, so a crafted ?next= can't send people to another site. */
export const SafeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : paths.home);
