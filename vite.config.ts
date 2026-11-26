import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const folders = (...names: string[]) => new RegExp(`[\\\\/]node_modules[\\\\/](${names.join('|')})[\\\\/]`);

/** Long-lived vendor chunks, cached by browsers across deploys. React's chunk holds everything React needs to start. */
const VENDOR_CHUNKS = [
  { name: 'react', packages: folders('react', 'react-dom', 'react-router', 'scheduler', 'use-sync-external-store', 'cookie', 'set-cookie-parser') },
  { name: 'data', packages: folders('@tanstack', 'axios', 'zod') },
  { name: 'ui', packages: folders('radix-ui', '@radix-ui', 'class-variance-authority', 'tailwind-merge', '@floating-ui', 'react-remove-scroll[^\\\\/]*', 'aria-hidden') },
  { name: 'realtime', packages: folders('socket.io-client', 'engine.io-client', 'socket.io-parser', 'engine.io-parser', '@socket.io') },
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // By package folder, so a package's files never split across chunks: split CommonJS made chunks import each
        // other and crashed the app on load.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          return VENDOR_CHUNKS.find(({ packages }) => packages.test(id))?.name;
        },
      },
    },
  },
});
