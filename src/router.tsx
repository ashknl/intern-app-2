import { createMemoryHistory, createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import Layout from './components/Layout';
import Home from './pages/Home';

const rootRoute = createRootRoute({
    component: Layout,
});

const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: Home,
});

const routeTree = rootRoute.addChildren([homeRoute]);

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
