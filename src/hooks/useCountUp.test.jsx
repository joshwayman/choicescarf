import { act, renderHook } from '@testing-library/react';
import { useCountUp } from './useCountUp';

// Drive requestAnimationFrame by hand so the tests don't depend on timing.
let frames;
let now;

function runFrame(ms) {
  now += ms;
  const pending = frames;
  frames = [];
  act(() => pending.forEach((cb) => cb(now)));
}

function runUntilIdle(step = 16, limit = 1000) {
  for (let i = 0; i < limit && frames.length; i++) runFrame(step);
}

beforeEach(() => {
  frames = [];
  now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    frames.push(cb);
    return frames.length;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    frames = [];
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.matchMedia;
});

describe('useCountUp', () => {
  it('reaches the target', () => {
    const { result } = renderHook(() => useCountUp(152, 800));
    runUntilIdle();
    expect(result.current).toBe(152);
  });

  it('takes the same time for big and small numbers', () => {
    const small = renderHook(() => useCountUp(10, 800));
    const big = renderHook(() => useCountUp(600, 800));

    runFrame(400);
    expect(small.result.current).toBeLessThan(10);
    expect(big.result.current).toBeLessThan(600);

    runFrame(400);
    expect(small.result.current).toBe(10);
    expect(big.result.current).toBe(600);
    expect(frames).toHaveLength(0);
  });

  it('animates from the current value when the target changes', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 800), {
      initialProps: { target: 152 },
    });
    runUntilIdle();

    rerender({ target: 100 });
    expect(result.current).toBe(152);

    runFrame(400);
    expect(result.current).toBeGreaterThan(100);
    expect(result.current).toBeLessThan(152);

    runUntilIdle();
    expect(result.current).toBe(100);
  });

  it('cancels the animation on unmount', () => {
    const { unmount } = renderHook(() => useCountUp(152, 800));
    runFrame(100);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(frames).toHaveLength(0);
  });

  it('jumps straight to the target when reduced motion is preferred', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    const { result } = renderHook(() => useCountUp(152, 800));
    runFrame(0);

    expect(result.current).toBe(152);
    expect(frames).toHaveLength(0);
  });
});
