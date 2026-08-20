import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Handoff seam: his own domain builds with VITE_BASE_PATH=/ — see README.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/priced-catalog/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
