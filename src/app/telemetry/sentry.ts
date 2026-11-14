// Only what errors.ts uses, so the bundler can leave the rest of Sentry out.
// Loaded as its own chunk, after the first render (#86).
export { breadcrumbsIntegration, init } from '@sentry/react';
