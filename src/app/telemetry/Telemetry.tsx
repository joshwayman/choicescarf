import { useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { loadAnalytics, trackPageView } from './analytics.ts';
import { loadErrorReporting } from './errors.ts';

/**
 * Starts analytics and error reporting after the first render, if they are
 * configured (#86), and records a page view whenever the route changes.
 * The calculation is in the query, which is never sent. Renders nothing.
 */
export function Telemetry() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (dsn) void loadErrorReporting(dsn).catch(() => undefined);
    const id = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    if (id) loadAnalytics(id);
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
