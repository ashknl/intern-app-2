import { createMemoryHistory, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import Layout from './components/Layout';
import Home from './pages/Home';
import DpExtension from './pages/DpExtension';

const rootRoute = createRootRoute({
    component: Layout,
});

const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Home,
});

const dpExtensionRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dp-extension',
    component: DpExtension,
});

const routeTree = rootRoute.addChildren([homeRoute, dpExtensionRoute]);

const memoryHistory = createMemoryHistory({
    initialEntries: ['/'],
});

export const router = createRouter({
    routeTree,
    history: memoryHistory,
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
