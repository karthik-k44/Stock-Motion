import type { EntitySchemaColumnOptions } from 'typeorm';

/**
 * Column presets for the entities. They describe the tables the SQL migrations create — the migrations own the
 * schema (constraints, indexes, the item_views view); entities only tell TypeORM how to read and write rows.
 */
export const Id: EntitySchemaColumnOptions = { type: 'text', primary: true, default: () => 'gen_random_uuid()::text' };
export const SerialId: EntitySchemaColumnOptions = { type: 'int', primary: true, generated: 'increment' };
export const Key: EntitySchemaColumnOptions = { type: 'text', primary: true };
export const Text: EntitySchemaColumnOptions = { type: 'text' };
export const TextOrNull: EntitySchemaColumnOptions = { type: 'text', nullable: true };
export const Int: EntitySchemaColumnOptions = { type: 'int' };
export const IntOrNull: EntitySchemaColumnOptions = { type: 'int', nullable: true };
export const Bool: EntitySchemaColumnOptions = { type: 'boolean' };
export const Time: EntitySchemaColumnOptions = { type: 'timestamptz' };
export const TimeOrNull: EntitySchemaColumnOptions = { type: 'timestamptz', nullable: true };
export const CreatedAt: EntitySchemaColumnOptions = { type: 'timestamptz', default: () => 'now()' };
/** Money and cost: NUMERIC(12, scale), read back as a string to keep every decimal. */
export const Numeric = (scale: 2 | 4): EntitySchemaColumnOptions => ({ type: 'numeric', precision: 12, scale });
