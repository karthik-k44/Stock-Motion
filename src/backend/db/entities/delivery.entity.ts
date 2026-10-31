import { EntitySchema } from 'typeorm';
import type { DeliveryLineRecord, DeliveryRow } from '../schema';
import { CreatedAt, Id, Int, IntOrNull, Key, Numeric, Text, TextOrNull, Time, TimeOrNull } from './columns';

export const DeliveryEntity = new EntitySchema<DeliveryRow>({
  name: 'Delivery',
  tableName: 'deliveries',
  columns: {
    id: Id,
    business_id: Text,
    number: Text,
    supplier_id: TextOrNull,
    supplier_name: Text,
    vehicle: { ...Text, default: '' },
    reference: { ...Text, default: '' },
    expected_at: Time,
    received_at: TimeOrNull,
    status: Text,
    created_at: CreatedAt,
  },
});

/** `received` stays null until the delivery is counted in; expected and received are both kept. */
export const DeliveryLineEntity = new EntitySchema<DeliveryLineRecord>({
  name: 'DeliveryLine',
  tableName: 'delivery_lines',
  columns: { delivery_id: Key, item_id: Key, position: Int, expected: Int, received: IntOrNull, unit_cost: { ...Numeric(4), default: 0 } },
});
