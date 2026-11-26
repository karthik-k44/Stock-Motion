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
    // No Razorpay keys, so checkout runs in manual mode; webhooks are signed with this test-only secret.
    env: { RAZORPAY_WEBHOOK_SECRET: 'test-webhook-secret' },
    hookTimeout: 30000,
  },
});
