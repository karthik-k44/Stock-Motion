import { EntitySchema } from 'typeorm';
import type { OrderLineRecord, OrderRecord } from '../schema';
import { Bool, CreatedAt, Id, Int, Key, Numeric, Text, TextOrNull, TimeOrNull } from './columns';

/** `reserves` and `closed` are copied from the template stage on every transition, so stock maths never needs the template. */
export const OrderEntity = new EntitySchema<OrderRecord>({
  name: 'Order',
  tableName: 'orders',
  columns: {
    id: Id,
    business_id: Text,
    number: Text,
    customer_id: TextOrNull,
    customer_name: Text,
    status: Text,
    reserves: { ...Bool, default: false },
    closed: { ...Bool, default: false },
    cancelled: { ...Bool, default: false },
    due_at: TimeOrNull,
    assignee_id: TextOrNull,
    notes: { ...Text, default: '' },
    created_at: CreatedAt,
    closed_at: TimeOrNull,
  },
});

/** `done` is how much of the line has already been taken from stock. */
export const OrderLineEntity = new EntitySchema<OrderLineRecord>({
  name: 'OrderLine',
  tableName: 'order_lines',
  columns: { order_id: Key, item_id: Key, position: Int, qty: Int, done: { ...Int, default: 0 }, unit_price: { ...Numeric(2), default: 0 } },
});
