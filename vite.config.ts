import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';

// Handoff seam: his own domain builds with VITE_BASE_PATH=/ — see README.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/priced-catalog/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sources: resolve(__dirname, 'sources.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
