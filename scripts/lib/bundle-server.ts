/** Compile src/backend/server.ts to one ES module for plain `node`. Used by `build:server` and `vercel-build`. */
import { cpSync } from 'node:fs';
import { dirname } from 'node:path';
import { build } from 'esbuild';

export const BundleServer = async (opts: {
  outfile: string;
  /** Leave every npm package to node_modules at runtime (Docker installs production dependencies) */
  externalPackages?: boolean;
  /** Packages to leave out when the rest are bundled in (optional drivers a library tries to load) */
  external?: string[];
}): Promise<void> => {
  await build({
    entryPoints: ['src/backend/server.ts'],
    outfile: opts.outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    tsconfig: 'tsconfig.node.json',
    sourcemap: true,
    logLevel: 'warning',
    packages: opts.externalPackages ? 'external' : undefined,
    external: opts.external,
    // CommonJS dependencies bundled into an ES module still call require() and read __dirname.
    banner: {
      js: [
        "import { createRequire as __createRequire } from 'node:module';",
        "import { fileURLToPath as __fileURLToPath } from 'node:url';",
        "import { dirname as __dirnameOf } from 'node:path';",
        'const require = __createRequire(import.meta.url);',
        'const __filename = __fileURLToPath(import.meta.url);',
        'const __dirname = __dirnameOf(__filename);',
      ].join('\n'),
    },
  });
  // The migrator reads `./migrations/` (SQL files and drizzle-kit's journal) next to the module that runs it: the bundle.
  cpSync('src/backend/db/migrations', `${dirname(opts.outfile)}/migrations`, { recursive: true });
};
