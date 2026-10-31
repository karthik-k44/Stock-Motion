import { EntitySchema } from 'typeorm';
import type { AccountRow, RefreshTokenRow } from '../schema';
import { CreatedAt, Id, Key, Text, Time, TimeOrNull } from './columns';

export const AccountEntity = new EntitySchema<AccountRow>({
  name: 'Account',
  tableName: 'accounts',
  columns: { id: Id, email: Text, name: Text, password_hash: Text, created_at: CreatedAt },
});

/** Stored hashed; a token is spent by setting `revoked_at`. */
export const RefreshTokenEntity = new EntitySchema<RefreshTokenRow>({
  name: 'RefreshToken',
  tableName: 'refresh_tokens',
  columns: { token_hash: Key, account_id: Text, expires_at: Time, revoked_at: TimeOrNull, created_at: CreatedAt },
});
