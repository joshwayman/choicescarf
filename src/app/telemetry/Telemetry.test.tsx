import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App.tsx';
import { createAppRouter } from '../router.tsx';
import { resetPageFocusForTests } from '../screens/Page.tsx';
import { resetAnalyticsForTests } from './analytics.ts';
import { resetErrorReportingForTests } from './errors.ts';

const sentry = vi.hoisted(() => ({ init: vi.fn(), breadcrumbsIntegration: vi.fn((o: unknown) => ({ name: 'Breadcrumbs', o })) }));
vi.mock('@sentry/react', () => sentry);

function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<App router={router} />);
  return router;
}

function gtagScript() {
  return document.head.querySelector<HTMLScriptElement>('script[src^="https://www.googletagmanager.com/gtag/js"]');
}

/** Everything pushed to the dataLayer, as plain arrays. */
function dataLayer(): unknown[][] {
  return (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
}

beforeEach(() => {
  document.documentElement.lang = 'en';
  localStorage.clear();
  resetPageFocusForTests();
  resetAnalyticsForTests();
  resetErrorReportingForTests();
  sentry.init.mockClear();
  delete window.dataLayer;
  delete window.gtag;
  gtagScript()?.remove();
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('analytics and error reporting (#86)', () => {
  it('loads neither when they are not configured', async () => {
    renderAt('/?v=1&t=garchomp&y=dragapult');
    await screen.findByRole('heading', { level: 1 });
    expect(gtagScript()).toBeNull();
    expect(window.dataLayer).toBeUndefined();
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('loads Google Analytics after the first render and sends page views without the calculation', async () => {
    vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST123');
    const user = userEvent.setup();
    renderAt('/?v=1&t=garchomp&y=dragapult');
    await screen.findByRole('heading', { level: 1 });
    expect(gtagScript()?.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST123');
    expect(dataLayer()).toContainEqual(['config', 'G-TEST123', expect.objectContaining({ send_page_view: false })]);
    await waitFor(() => {
      expect(dataLayer().filter((e) => e[1] === 'page_view')).toHaveLength(1);
    });

    // Going to About sends its path, and still no calculation.
    await user.click(screen.getByRole('link', { name: 'More' }));
    await user.click(await screen.findByRole('link', { name: 'About ChoiceScarf' }));
    await waitFor(() => {
      expect(dataLayer().filter((e) => e[1] === 'page_view').map((e) => (e[2] as { page_path: string }).page_path)).toEqual([
        '/',
        '/more',
        '/about',
      ]);
    });
    expect(JSON.stringify(dataLayer())).not.toMatch(/garchomp|dragapult|v=1/);
  });

  it('starts Sentry with nothing about the person, and scrubs every event', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/0');
    renderAt('/?v=1&t=garchomp');
    await waitFor(() => {
      expect(sentry.init).toHaveBeenCalledOnce();
    });
    const options = sentry.init.mock.calls[0]?.[0] as {
      dsn: string;
      dataCollection: Record<string, unknown>;
      beforeSend: (event: object) => object;
      integrations: (defaults: { name: string }[]) => { name: string }[];
    };
    expect(options.dsn).toBe('https://public@o0.ingest.sentry.io/0');
    expect(options.dataCollection).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    });
    // The default breadcrumbs are swapped for ones that don't record clicks or typing.
    const integrations = options.integrations([{ name: 'Breadcrumbs' }, { name: 'GlobalHandlers' }]);
    expect(integrations.map((i) => i.name)).toEqual(['GlobalHandlers', 'Breadcrumbs']);
    expect(sentry.breadcrumbsIntegration).toHaveBeenCalledWith({ dom: false });
    const sent = options.beforeSend({ request: { url: 'https://choicescarf.com/?v=1&t=garchomp' } });
    expect(JSON.stringify(sent)).not.toContain('garchomp');
  });
});
