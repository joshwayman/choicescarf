import { scrubUrl } from './scrub.ts';

/**
 * Google Analytics 4, loaded with its own tag (ADR 0001, decision 11; #86).
 * Page views are sent by hand, with the path only, so the calculation in
 * the query is never sent.
 */

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let measurementId: string | undefined;

export function loadAnalytics(id: string, doc: Document = document): void {
  if (measurementId !== undefined) return;
  measurementId = id;
  const win = doc.defaultView ?? window;
  win.dataLayer = win.dataLayer ?? [];
  // gtag must push the arguments object itself, as Google's snippet does.
  win.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    win.dataLayer?.push(arguments);
  };
  win.gtag('js', new Date());
  win.gtag('config', id, {
    send_page_view: false,
    page_location: scrubUrl(win.location.href),
    page_referrer: doc.referrer ? scrubUrl(doc.referrer) : undefined,
  });
  const script = doc.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  doc.head.append(script);
}

/** Records a page view by path: "/", "/about". */
export function trackPageView(pathname: string, win: Window = window): void {
  if (measurementId === undefined || !win.gtag) return;
  win.gtag('event', 'page_view', {
    page_location: scrubUrl(`${win.location.origin}${pathname}`),
    page_path: pathname,
    page_title: win.document.title,
  });
}

/** For tests: forget that analytics was loaded. */
export function resetAnalyticsForTests(): void {
  measurementId = undefined;
}
