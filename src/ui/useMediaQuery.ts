import { useCallback, useSyncExternalStore } from 'react';

/** True while a media query matches, such as "(min-width: 720px)". False where there is no window. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The width at which the desktop layouts take over (the header and Calculator). */
export const DESKTOP = '(min-width: 720px)';
