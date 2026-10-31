import type { EntitySchema } from 'typeorm';
import { AccountEntity, RefreshTokenEntity } from './account.entity';
import { BusinessEntity, InviteEntity, MembershipEntity } from './business.entity';
import { CategoryEntity, CustomerEntity, LocationEntity, SupplierEntity } from './catalog.entity';
import { DeliveryEntity, DeliveryLineEntity } from './delivery.entity';
import { ItemComponentEntity, ItemEntity, ItemViewEntity } from './item.entity';
import { ActivityEntity, MovementEntity } from './ledger.entity';
import { OrderEntity, OrderLineEntity } from './order.entity';

export * from './account.entity';
export * from './business.entity';
export * from './catalog.entity';
export * from './delivery.entity';
export * from './item.entity';
export * from './ledger.entity';
export * from './order.entity';

/** Every entity, registered with the DataSource in `db/client.ts`. */
export const ENTITIES = [
  AccountEntity,
  RefreshTokenEntity,
  BusinessEntity,
  MembershipEntity,
  InviteEntity,
  LocationEntity,
  CategoryEntity,
  SupplierEntity,
  CustomerEntity,
  ItemEntity,
  ItemComponentEntity,
  ItemViewEntity,
  OrderEntity,
  OrderLineEntity,
  DeliveryEntity,
  DeliveryLineEntity,
  MovementEntity,
  ActivityEntity,
];

/** The query builder joins an entity by class or by name; these entities are schemas, so they join by name. */
export const NameOf = <T extends object>(entity: EntitySchema<T>): string => entity.options.name;
