import { db } from '@/backend/db/client';
import type { UserRow } from '@/backend/db/schema';
import type { UserResponseType, UserRoleTypeEnum } from '@/backend/types/user';

const toUser = (r: UserRow): UserResponseType => ({
  id: r.id,
  name: r.name,
  role: r.role as UserRoleTypeEnum,
  initials: r.initials,
  vest: r.vest,
  skin: r.skin,
  hat: r.hat,
});

async function List(): Promise<UserResponseType[]> {
  const { rows } = await db.query<UserRow>('SELECT * FROM users ORDER BY name');
  return rows.map(toUser);
}

async function Find(id: string): Promise<UserResponseType | null> {
  const { rows } = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ? toUser(rows[0]) : null;
}

export const usersService = { List, Find };
