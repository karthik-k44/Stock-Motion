import { EntitySchema } from 'typeorm';
import type { BusinessRow, InviteRow, MembershipRow } from '../schema';
import { CreatedAt, Id, Key, Text, TextOrNull, Time, TimeOrNull } from './columns';

export const BusinessEntity = new EntitySchema<BusinessRow>({
  name: 'Business',
  tableName: 'businesses',
  columns: { id: Id, name: Text, type: Text, currency: { ...Text, default: 'USD' }, created_by: TextOrNull, created_at: CreatedAt },
});

/** Who belongs to which business, and as what. Checked on every business-scoped request. */
export const MembershipEntity = new EntitySchema<MembershipRow>({
  name: 'Membership',
  tableName: 'memberships',
  columns: { business_id: Key, account_id: Key, role: Text, color: Text, created_at: CreatedAt },
});

export const InviteEntity = new EntitySchema<InviteRow>({
  name: 'Invite',
  tableName: 'invites',
  columns: {
    id: Id,
    token_hash: Text,
    business_id: Text,
    role: Text,
    created_by: TextOrNull,
    expires_at: Time,
    accepted_at: TimeOrNull,
    accepted_by: TextOrNull,
    revoked_at: TimeOrNull,
    created_at: CreatedAt,
  },
});
