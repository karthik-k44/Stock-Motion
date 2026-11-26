/** `npm run build:server`. Not in `dist/`, which is served to browsers. */
import { rmSync } from 'node:fs';
import { BundleServer } from './lib/bundle-server';

const OUT = 'build/server';

rmSync(OUT, { recursive: true, force: true });
await BundleServer({ outfile: `${OUT}/server.mjs`, externalPackages: true });
console.log(`Server compiled to ${OUT}/server.mjs`);
