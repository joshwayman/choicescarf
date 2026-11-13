import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        // The design token page (#81), at /tokens.html.
        tokens: fileURLToPath(new URL('tokens.html', import.meta.url)),
        // The component set (#83), at /components.html.
        components: fileURLToPath(new URL('components.html', import.meta.url)),
      },
    },
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
          // Vitest blanks CSS in tests. The token tests read tokens.css as text.
          css: { include: [/src\/ui\/tokens\.css/] },
          setupFiles: ['./src/app/setupTests.ts'],
        },
      },
    ],
  },
});
