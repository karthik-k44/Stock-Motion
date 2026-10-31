/**
 * `npm run db:migration:create -- AddSupplierNotes` — writes an empty TypeORM migration in this project's style
 * (type-only imports, arrow functions) to src/backend/db/migrations/, ready to fill in and list in index.ts.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const name = process.argv[2] ?? '';
if (!/^[A-Z][A-Za-z0-9]+$/.test(name)) {
  console.error('Give the migration a PascalCase name, e.g. npm run db:migration:create -- AddSupplierNotes');
  process.exit(1);
}

const timestamp = Date.now();
const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const file = fileURLToPath(new URL(`../src/backend/db/migrations/${timestamp}-${kebab}.ts`, import.meta.url));
if (existsSync(file)) throw new Error(`${file} already exists`);

writeFileSync(
  file,
  `import type { MigrationInterface, QueryRunner } from 'typeorm';

/** TODO: what this changes, and why. */
export class ${name}${timestamp} implements MigrationInterface {
  name = '${name}${timestamp}';

  up = async (qr: QueryRunner): Promise<void> => {
    await qr.query(\`\`);
  };

  down = async (qr: QueryRunner): Promise<void> => {
    await qr.query(\`\`);
  };
}
`,
);
console.log(`Created ${file}\nNext: write up/down, add ${name}${timestamp} to MIGRATIONS in src/backend/db/migrations/index.ts,`);
console.log('and update the matching entity in src/backend/db/entities/ if columns changed.');
