import { defineConfig } from 'drizzle-kit';

/** `npm run db:generate -- --name <change>` writes a migration from the schema in src/backend/db/schema/. */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/backend/db/schema/index.ts',
  out: './src/backend/db/migrations',
});
