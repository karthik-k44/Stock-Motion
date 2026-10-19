import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/backend/tests/**/*.test.ts'],
    // Each file runs its own in-memory Postgres; running them all at once exhausts memory on Windows.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
