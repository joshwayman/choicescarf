/// <reference types="vite/client" />

// Build-time settings for analytics and error reporting (#86). Every one is
// optional: left unset, that service is not loaded. See .env.example.
interface ImportMetaEnv {
  /** Google Analytics 4 measurement id, such as G-XXXXXXXXXX. */
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  /** Sentry DSN for the browser. */
  readonly VITE_SENTRY_DSN?: string;
  /** Which deployment this is: production, preview or development. Set from VERCEL_ENV by vite.config.ts. */
  readonly VITE_DEPLOY_ENV?: string;
  /** The commit being deployed. Set from VERCEL_GIT_COMMIT_SHA by vite.config.ts. */
  readonly VITE_RELEASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
