import { RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';
import { createAppRouter } from './router.tsx';

export interface AppProps {
  /** A router to use instead of the browser one, for tests. */
  router?: ReturnType<typeof createAppRouter>;
}

/** The whole app: the router, which renders the shell around each screen. */
export function App({ router: given }: AppProps) {
  const [router] = useState(() => given ?? createAppRouter());
  return <RouterProvider router={router} />;
}
