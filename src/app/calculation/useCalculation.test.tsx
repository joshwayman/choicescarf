import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Link,
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { SEARCH_FORMAT, validateCalculationSearch } from '../router.tsx';
import { useCalculation, useShareUrl } from './useCalculation.ts';

/** A stand-in screen that edits the target's EVs and species through the URL. */
function Probe() {
  const [calc, setCalc] = useCalculation();
  const shareUrl = useShareUrl();
  return (
    <>
      <p data-testid="calc">{JSON.stringify({ species: calc.target.species, ev: calc.target.ev })}</p>
      <label>
        EVs
        <input
          value={calc.target.ev}
          onChange={(event) => {
            setCalc({ ...calc, target: { ...calc.target, ev: Number(event.target.value) || 0 } });
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          setCalc({ ...calc, target: { ...calc.target, species: 'dragapult' } }, { push: true });
        }}
      >
        Pick Dragapult
      </button>
      <p data-testid="share">{shareUrl()}</p>
      <Link to="/more" search>
        More
      </Link>
    </>
  );
}

function setup(path: string) {
  const root = createRootRoute({ validateSearch: validateCalculationSearch, component: Outlet });
  const tree = root.addChildren([
    createRoute({ getParentRoute: () => root, path: '/', component: Probe }),
    createRoute({
      getParentRoute: () => root,
      path: '/more',
      component: () => (
        <Link to="/" search>
          Back to the calculation
        </Link>
      ),
    }),
  ]);
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree: tree, history, ...SEARCH_FORMAT });
  render(<RouterProvider router={router} />);
  return { router, history };
}

const shown = () => JSON.parse(screen.getByTestId('calc').textContent) as { species?: string; ev: number };

describe('useCalculation', () => {
  it('reads the calculation from the URL', async () => {
    setup('/?v=1&t=garchomp&t.ev=100');
    await screen.findByTestId('calc');
    expect(shown()).toEqual({ species: 'garchomp', ev: 100 });
  });

  it('writes typing to the URL without adding history entries', async () => {
    const { router, history } = setup('/?v=1&t=garchomp');
    const input = await screen.findByRole('textbox', { name: 'EVs' });
    for (const value of ['100', '120', '148']) fireEvent.change(input, { target: { value } });
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&t.ev=148');
    expect(history.length).toBe(1);
  });

  it('writes the cleaned value, never an out-of-range one', async () => {
    const { router } = setup('/?v=1&t=garchomp');
    fireEvent.change(await screen.findByRole('textbox', { name: 'EVs' }), { target: { value: '250' } });
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&t.ev=248');
  });

  it('adds a history entry when asked, so Back undoes the change', async () => {
    const user = userEvent.setup();
    const { router, history } = setup('/?v=1&t=garchomp');
    await user.click(await screen.findByRole('button', { name: 'Pick Dragapult' }));
    expect(shown().species).toBe('dragapult');
    expect(history.length).toBe(2);
    act(() => {
      router.history.back();
    });
    expect(await screen.findByText(/"species":"garchomp"/)).toBeInTheDocument();
  });

  it('writes nothing for a fresh calculation', async () => {
    const { router } = setup('/?v=1&t.ev=100');
    fireEvent.change(await screen.findByRole('textbox', { name: 'EVs' }), { target: { value: '252' } });
    expect(router.state.location.searchStr).toBe('');
  });

  it('loads a hand-broken link without crashing, cleaned', async () => {
    setup('/?t=GARCHOMP&t.ev=999&t.nat=fast&weather=hail&%%%=1&utm_source=x&t=dragapult');
    await screen.findByTestId('calc');
    expect(shown()).toEqual({ species: 'garchomp', ev: 252 });
    expect(screen.getByTestId('share').textContent).toBe('http://localhost:3000/?v=1&t=garchomp');
  });

  it('shares the cleaned link', async () => {
    setup('/?t.ev=4&t=garchomp');
    await screen.findByTestId('calc');
    expect(screen.getByTestId('share').textContent).toBe('http://localhost:3000/?v=1&t=garchomp&t.ev=4');
  });

  it('keeps the calculation when going to More and back', async () => {
    const user = userEvent.setup();
    const { router } = setup('/?v=1&t=garchomp&t.ev=100');
    await user.click(await screen.findByRole('link', { name: 'More' }));
    expect(router.state.location.pathname).toBe('/more');
    expect(router.state.location.searchStr).toBe('?v=1&t=garchomp&t.ev=100');
    await user.click(screen.getByRole('link', { name: 'Back to the calculation' }));
    expect(shown()).toEqual({ species: 'garchomp', ev: 100 });
  });
});
