import { EntitySchema } from 'typeorm';
import type { CategoryRow, CustomerRow, LocationRow, SupplierRow } from '../schema';
import { CreatedAt, Id, Int, Key, Text } from './columns';

export const LocationEntity = new EntitySchema<LocationRow>({
  name: 'Location',
  tableName: 'locations',
  columns: { business_id: Key, code: Key, zone: Text, name: Text, position: { ...Int, default: 0 } },
});

export const CategoryEntity = new EntitySchema<CategoryRow>({
  name: 'Category',
  tableName: 'categories',
  columns: { business_id: Key, code: Key, name: Text, position: { ...Int, default: 0 } },
});

export const SupplierEntity = new EntitySchema<SupplierRow>({
  name: 'Supplier',
  tableName: 'suppliers',
  columns: {
    id: Id,
    business_id: Text,
    name: Text,
    contact: { ...Text, default: '' },
    email: { ...Text, default: '' },
    phone: { ...Text, default: '' },
    lead_days: { ...Int, default: 2 },
    created_at: CreatedAt,
  },
});

export const CustomerEntity = new EntitySchema<CustomerRow>({
  name: 'Customer',
  tableName: 'customers',
  columns: {
    id: Id,
    business_id: Text,
    name: Text,
    email: { ...Text, default: '' },
    phone: { ...Text, default: '' },
    address: { ...Text, default: '' },
    notes: { ...Text, default: '' },
    created_at: CreatedAt,
  },
});
