import { scrubBreadcrumb, scrubEvent } from './scrub.ts';

/**
 * Sentry error reporting (ADR 0001, decision 11; #86). Loaded as its own
 * chunk after the first render, so it never delays the app, and failing to
 * load it (blocked, offline) changes nothing. Events lose the calculation
 * in the URL and UI breadcrumbs before they are sent.
 */
let started = false;

export async function loadErrorReporting(dsn: string): Promise<void> {
  if (started) return;
  started = true;
  const Sentry = await import('./sentry.ts');
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_DEPLOY_ENV ?? 'development',
    ...(import.meta.env.VITE_RELEASE ? { release: import.meta.env.VITE_RELEASE } : {}),
    // Nothing about the person or what they typed: no user, cookies,
    // headers, bodies or query (the calculation is in the query).
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    integrations: (defaults) => [
      ...defaults.filter((integration) => integration.name !== 'Breadcrumbs'),
      Sentry.breadcrumbsIntegration({ dom: false }),
    ],
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
    beforeSend: (event) => scrubEvent(event),
  });
}

/** For tests: forget that error reporting was started. */
export function resetErrorReportingForTests(): void {
  started = false;
}
