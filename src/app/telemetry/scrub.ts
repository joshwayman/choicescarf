/**
 * Keeps what people type on their device (ADR 0001, decision 11; #86). The
 * calculation lives in the URL's query, so every address sent to analytics
 * or error reporting loses its query and fragment.
 */
export function scrubUrl(url: string): string {
  try {
    const parsed = new URL(url, 'https://choicescarf.invalid');
    return url.startsWith('/') ? parsed.pathname : `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split(/[?#]/, 1)[0] ?? '';
  }
}

/** The parts of a Sentry event and breadcrumb that can carry a URL. */
interface ScrubbableEvent {
  request?: { url?: string; query_string?: unknown; headers?: Record<string, string> };
  breadcrumbs?: ScrubbableBreadcrumb[];
}

interface ScrubbableBreadcrumb {
  category?: string;
  data?: Record<string, unknown>;
}

/** Removes URLs' queries from a Sentry breadcrumb, and drops UI ones (they can name what was picked). */
export function scrubBreadcrumb<B extends ScrubbableBreadcrumb>(breadcrumb: B): B | null {
  if (breadcrumb.category?.startsWith('ui.')) return null;
  const data = breadcrumb.data;
  if (data) {
    for (const key of ['url', 'from', 'to']) {
      const value = data[key];
      if (typeof value === 'string') data[key] = scrubUrl(value);
    }
  }
  return breadcrumb;
}

/** Removes the calculation from a Sentry event before it is sent. */
export function scrubEvent<E extends ScrubbableEvent>(event: E): E {
  if (event.request) {
    if (event.request.url) event.request.url = scrubUrl(event.request.url);
    delete event.request.query_string;
    if (event.request.headers?.Referer) event.request.headers.Referer = scrubUrl(event.request.headers.Referer);
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.flatMap((b) => {
      const kept = scrubBreadcrumb(b);
      return kept ? [kept] : [];
    });
  }
  return event;
}
