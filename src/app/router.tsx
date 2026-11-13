import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  type RouterHistory,
} from '@tanstack/react-router';
import { Shell } from './Shell.tsx';
import { About } from './screens/About.tsx';
import { Calculator } from './screens/Calculator.tsx';
import { More } from './screens/More.tsx';
import { Privacy } from './screens/Privacy.tsx';

/**
 * The routes (#84). In v5.0 Calculator is the only mode, so it lives at
 * `/`; Quick and Battle get their own paths when they arrive. Any unknown
 * path goes back to Calculator, replacing the bad entry in history so the
 * back button doesn't return to it.
 */
const rootRoute = createRootRoute({
  component: Shell,
  notFoundComponent: () => <Navigate to="/" replace />,
});

const calculatorRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Calculator });
const moreRoute = createRoute({ getParentRoute: () => rootRoute, path: '/more', component: More });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/about', component: About });
const privacyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/privacy', component: Privacy });

const routeTree = rootRoute.addChildren([calculatorRoute, moreRoute, aboutRoute, privacyRoute]);

/** Make the router. Tests pass a memory history; the app uses the browser's. */
export function createAppRouter(history: RouterHistory = createBrowserHistory()) {
  return createRouter({ routeTree, history, scrollRestoration: true });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
