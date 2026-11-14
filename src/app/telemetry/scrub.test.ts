import { describe, expect, it } from 'vitest';
import { scrubBreadcrumb, scrubEvent, scrubUrl } from './scrub.ts';

describe('scrubUrl', () => {
  it.each([
    ['https://choicescarf.com/?v=1&t=garchomp&y=dragapult', 'https://choicescarf.com/'],
    ['https://choicescarf.com/about?v=1&t=garchomp#credits', 'https://choicescarf.com/about'],
    ['/privacy?v=1&t=garchomp', '/privacy'],
    ['/', '/'],
  ])('%s → %s', (url, expected) => {
    expect(scrubUrl(url)).toBe(expected);
  });
});

describe('scrubBreadcrumb', () => {
  it('drops UI breadcrumbs, which can name what was clicked', () => {
    expect(scrubBreadcrumb({ category: 'ui.click', data: { target: 'Change Pokémon, now Garchomp' } })).toBeNull();
  });

  it('removes the query from navigations and requests', () => {
    expect(
      scrubBreadcrumb({ category: 'navigation', data: { from: '/?v=1&t=garchomp', to: '/about?v=1&t=garchomp' } }),
    ).toEqual({ category: 'navigation', data: { from: '/', to: '/about' } });
    expect(
      scrubBreadcrumb({ category: 'fetch', data: { url: 'https://choicescarf.com/sprites/gen5/garchomp.png?x=1' } }),
    ).toEqual({ category: 'fetch', data: { url: 'https://choicescarf.com/sprites/gen5/garchomp.png' } });
  });
});

describe('scrubEvent', () => {
  it('removes the calculation from the request and the breadcrumbs', () => {
    const event = scrubEvent({
      request: {
        url: 'https://choicescarf.com/?v=1&t=garchomp&y=dragapult',
        query_string: 'v=1&t=garchomp&y=dragapult',
        headers: { Referer: 'https://choicescarf.com/about?v=1&t=garchomp', 'User-Agent': 'test' },
      },
      breadcrumbs: [
        { category: 'ui.input', data: { value: 'garchomp' } },
        { category: 'navigation', data: { from: '/?v=1&t=garchomp', to: '/about?v=1&t=garchomp' } },
      ],
    });
    expect(JSON.stringify(event)).not.toMatch(/garchomp|dragapult/);
    expect(event.request.url).toBe('https://choicescarf.com/');
    expect(event.request.headers['User-Agent']).toBe('test');
    expect(event.breadcrumbs).toHaveLength(1);
  });
});
