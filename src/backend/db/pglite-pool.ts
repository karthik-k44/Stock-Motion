import { EventEmitter } from 'node:events';
import type { PGlite, Results } from '@electric-sql/pglite';

type ConnectCallback = (err: Error | null, client: unknown, release: () => void) => void;

/** node-postgres reports the statement kind and the rows it touched, and TypeORM reads both. */
const commandOf = (sql: string) => /^\s*(\w+)/.exec(sql)?.[1]?.toUpperCase() ?? '';
const asPgResult = (sql: string, r: Results) => ({
  rows: r.rows,
  rowCount: r.affectedRows ?? r.rows.length,
  command: commandOf(sql),
  fields: r.fields,
});

/**
 * A node-postgres-shaped driver over one embedded PGlite database, for TypeORM's postgres dialect
 * (`new DataSource({ type: 'postgres', driver: PGliteDriverFor(lite) })`).
 *
 * PGlite is a single session, so the pool lends it to one borrower at a time — like a real pool of size 1:
 * a transaction holds it from START TRANSACTION to COMMIT/ROLLBACK, and every other query waits its turn.
 * Without that, concurrent requests would run inside each other's transactions (no isolation, and one
 * request's rollback could undo another's writes). Inside a transaction, always pass the transaction's
 * manager on — using the shared `db` there would wait for the transaction to finish, i.e. forever.
 */
export const PGliteDriverFor = (lite: PGlite) => {
  let queue: Promise<void> = Promise.resolve();

  const client = Object.assign(new EventEmitter(), {
    query: async (sql: string, params?: unknown[]) => {
      if (params?.length) return asPgResult(sql, await lite.query(sql, params));
      // Without parameters the text may hold several statements (migrations): report the last, like node-postgres.
      const results = await lite.exec(sql);
      return asPgResult(sql, results.at(-1) ?? { rows: [], fields: [] });
    },
  });

  class Pool extends EventEmitter {
    connect(cb: ConnectCallback) {
      let release!: () => void;
      const turn = new Promise<void>((resolve) => (release = resolve));
      const previous = queue;
      queue = previous.then(() => turn);
      void previous.then(() => cb(null, client, release));
    }

    end(cb?: (err: Error | null) => void) {
      cb?.(null);
    }
  }

  return { Pool };
};
