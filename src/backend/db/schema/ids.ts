import { desc, sql } from 'drizzle-orm';
import { pgSequence, text, type AnyPgColumn } from 'drizzle-orm/pg-core';

/**
 * Every id is a readable prefix and a number from the table's own sequence, from 100000 up: ACID100000 is the first
 * account. The database assigns them, so ids stay unique under concurrent inserts. Changing a prefix here needs a
 * migration that renames existing ids (see 0004_prefixed_ids.sql).
 */
export const ID_PREFIXES = {
  accounts: 'ACID',
  businesses: 'BSID',
  invites: 'INID',
  suppliers: 'SPID',
  customers: 'CSID',
  items: 'ITID',
  orders: 'ORID',
  deliveries: 'DLID',
  movements: 'MVID',
  activity: 'ATID',
} as const;

export const ID_START = 100000;

type IdTableType = keyof typeof ID_PREFIXES;

const sequence = (table: IdTableType) => pgSequence(`${table}_id_seq`, { startWith: ID_START, minValue: ID_START });

export const accountsIdSeq = sequence('accounts');
export const businessesIdSeq = sequence('businesses');
export const invitesIdSeq = sequence('invites');
export const suppliersIdSeq = sequence('suppliers');
export const customersIdSeq = sequence('customers');
export const itemsIdSeq = sequence('items');
export const ordersIdSeq = sequence('orders');
export const deliveriesIdSeq = sequence('deliveries');
export const movementsIdSeq = sequence('movements');
export const activityIdSeq = sequence('activity');

/**
 * Newest first by id, for a stable tie-break among rows with the same timestamp. Ids compare as text, so the longer
 * one (ATID1000000) is newer than any shorter one (ATID999999).
 */
export const NewestIdFirst = (column: AnyPgColumn) => [desc(sql`length(${column})`), desc(column)];

/** The `id` column of `table`: e.g. 'ACID' || nextval('accounts_id_seq'). */
export const prefixedId = (table: IdTableType) =>
  text()
    .primaryKey()
    .default(sql.raw(`'${ID_PREFIXES[table]}' || nextval('${table}_id_seq')`));
