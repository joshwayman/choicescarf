import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  test: {
    projects: [
      {
        // The engine and the data build run in Node: no DOM.
        extends: true,
        test: {
          name: 'engine',
          include: ['src/engine/**/*.test.ts', 'src/data/**/*.test.ts', 'tests/**/*.test.ts', 'scripts/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          include: ['src/app/**/*.test.{ts,tsx}', 'src/ui/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['./src/app/setupTests.ts'],
        },
      },
    ],
  },
});
