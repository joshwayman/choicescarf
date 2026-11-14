import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Offline and the update notice (#85). The service worker stores the app
    // with it (precache), offers a new version through UpdateNotice instead of
    // applying it, and caches battle sprites and other fonts as they are used.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      // The header logo and the browser icons. The install icons are only
      // needed when installing, so they aren't stored for offline use.
      includeAssets: ['logo.png', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png'],
      includeManifestIcons: false,
      manifest: {
        name: 'ChoiceScarf: Pokémon Speed EV Calculator',
        short_name: 'ChoiceScarf',
        description:
          'Work out the minimum Speed EVs your Pokémon needs to outspeed a target, for every nature, and whether you need a Choice Scarf.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#10111c',
        background_color: '#fff45c',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app (with its data), the two icon sheets and the Latin fonts. Battle sprites and other scripts' fonts are
        // cached when first used (runtimeCaching), not up front.
        globPatterns: [
          '**/*.{js,css,html}',
          'assets/*.png',
          'assets/*-latin-*.woff2',
          'assets/*-latin-ext-*.woff2',
        ],
        globIgnores: ['og-image.png', 'sprites/**', 'tokens.html', 'components.html', 'assets/tokens-*', 'assets/components-*'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/tokens\.html/, /^\/components\.html/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/sprites/gen5/'),
            handler: 'CacheFirst',
            options: { cacheName: 'battle-sprites', expiration: { maxEntries: 300 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.woff2'),
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 40 } },
          },
        ],
      },
    }),
  ],
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
