import { useNavigate, useRouter, useSearch } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import type { Calculation } from './state.ts';
import { canonical, decode, encode } from './url.ts';

export interface SetCalculationOptions {
  /**
   * Add a history entry, so Back undoes this change (picking a different
   * Pokémon, say). Off by default: typing replaces the current entry, so
   * Back doesn't step through every keystroke.
   */
  push?: boolean;
}

/**
 * The calculation in the URL, and a way to change it. The URL is the single
 * source of truth: there is no other copy to keep in step.
 */
export function useCalculation() {
  const search = useSearch({ from: '__root__' });
  const navigate = useNavigate();
  const calculation = useMemo(() => decode(search), [search]);

  const setCalculation = useCallback(
    (next: Calculation, options: SetCalculationOptions = {}) => {
      // Written in its cleaned form, so the address bar never holds an out-of-range value.
      void navigate({ to: '.', search: canonical(encode(next)), replace: options.push !== true });
    },
    [navigate],
  );

  return [calculation, setCalculation] as const;
}

/** The full link to the current calculation, for "Copy link". Always the cleaned form. */
export function useShareUrl(): () => string {
  const router = useRouter();
  const search = useSearch({ from: '__root__' });
  return useCallback(() => {
    // Cleaned here: the router keeps unknown keys alongside the validated ones, and a
    // shared link should be the tidy form whatever was typed into the address bar.
    const { href } = router.buildLocation({ to: '.', search: canonical(search) });
    return new URL(href, window.location.origin).toString();
  }, [router, search]);
}
